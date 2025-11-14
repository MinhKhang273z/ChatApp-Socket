/**
 * Socket.io Event Handlers
 * Xử lý tất cả socket events: join, leave, messages, typing...
 */

// Store connected users: Map<socketId, userInfo>
export const users = new Map();

// Store rooms: Map<roomName, Array<userInfo>>
export const rooms = new Map();

/**
 * Xử lý khi user join room
 * Events:
 * - Emit 'user:joined' cho các users khác trong room
 * - Emit 'room:info' về room info cho user vừa join
 */
export const handleUserJoin = (socket, data) => {
  const { username, room } = data;
  
  // Validate input
  if (!username || !username.trim()) {
    socket.emit('error', { message: 'Username không được để trống' });
    return;
  }
  
  if (!room || !room.trim()) {
    socket.emit('error', { message: 'Room không được để trống' });
    return;
  }

  // Store user info
  users.set(socket.id, {
    id: socket.id,
    username: username.trim(),
    room: room.trim(),
    joinedAt: new Date()
  });

  // Join socket vào room
  socket.join(room);

  // Initialize room nếu chưa tồn tại
  if (!rooms.has(room)) {
    rooms.set(room, {
      users: [],
      messages: []
    });
  }

  // Add user to room's user list
  const roomData = rooms.get(room);
  roomData.users.push({
    id: socket.id,
    username: username.trim(),
    joinedAt: new Date()
  });

  // Thông báo các users khác: có user mới join
  socket.to(room).emit('user:joined', {
    username: username.trim(),
    message: `${username} đã vào phòng chat`,
    timestamp: new Date(),
    totalUsersInRoom: roomData.users.length
  });

  // Gửi room info cho user vừa join
  socket.emit('room:info', {
    room,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    messages: roomData.messages.slice(-50) // Last 50 messages
  });

  console.log(`✅ ${username} join room: ${room} (Total: ${roomData.users.length})`);
};

/**
 * Xử lý khi user gửi message
 * Events:
 * - Broadcast 'message:receive' cho tất cả users trong room
 * - Lưu message vào room (max 100 messages per room)
 */
export const handleMessageSend = (socket, data) => {
  const user = users.get(socket.id);
  
  if (!user) {
    socket.emit('error', { message: 'Bạn phải join room trước tiên' });
    return;
  }

  const { text } = data;
  
  if (!text || !text.trim()) {
    socket.emit('error', { message: 'Tin nhắn không được để trống' });
    return;
  }

  const message = {
    id: `${socket.id}-${Date.now()}`,
    username: user.username,
    text: text.trim(),
    room: user.room,
    timestamp: new Date()
  };

  // Store message in room
  const roomData = rooms.get(user.room);
  if (roomData) {
    roomData.messages.push(message);
    
    // Keep only last 100 messages per room (tránh memory leak)
    if (roomData.messages.length > 100) {
      roomData.messages.shift();
    }
  }

  // Broadcast message tới tất cả users trong room
  const io = socket.server;
  io.to(user.room).emit('message:receive', message);
  
  console.log(`💬 ${user.username} in ${user.room}: ${text}`);
};

/**
 * Xử lý typing indicator - khi user bắt đầu gõ
 * Events:
 * - Emit 'typing:start' cho các users khác
 */
export const handleTypingStart = (socket) => {
  const user = users.get(socket.id);
  if (user) {
    socket.to(user.room).emit('typing:start', {
      username: user.username
    });
  }
};

/**
 * Xử lý typing indicator - khi user dừng gõ
 * Events:
 * - Emit 'typing:stop' cho các users khác
 */
export const handleTypingStop = (socket) => {
  const user = users.get(socket.id);
  if (user) {
    socket.to(user.room).emit('typing:stop', {
      username: user.username
    });
  }
};

/**
 * Xử lý khi user disconnect (rời khỏi)
 * Events:
 * - Emit 'user:left' thông báo các users khác
 * - Xóa user khỏi users map
 * - Xóa user khỏi room
 */
export const handleUserDisconnect = (socket) => {
  const user = users.get(socket.id);
  
  if (user) {
    const roomData = rooms.get(user.room);
    if (roomData) {
      // Remove user from room's user list
      const index = roomData.users.findIndex(u => u.id === socket.id);
      if (index > -1) {
        roomData.users.splice(index, 1);
      }
      
      // Thông báo users khác: user này đã rời khỏi
      const io = socket.server;
      io.to(user.room).emit('user:left', {
        username: user.username,
        message: `${user.username} đã rời khỏi phòng chat`,
        timestamp: new Date(),
        totalUsersInRoom: roomData.users.length
      });

      // Nếu room trống, xóa room
      if (roomData.users.length === 0) {
        rooms.delete(user.room);
        console.log(`🗑️  Room ${user.room} deleted (empty)`);
      }
    }

    users.delete(socket.id);
    console.log(`❌ ${user.username} disconnected (from ${user.room})`);
  } else {
    console.log(`❌ User ${socket.id} disconnected`);
  }
};

/**
 * Setup tất cả socket event listeners
 * Gọi hàm này khi có user connect
 */
export const setupSocketListeners = (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  // Listen to user:join event
  socket.on('user:join', (data) => handleUserJoin(socket, data));
  
  // Listen to message:send event
  socket.on('message:send', (data) => handleMessageSend(socket, data));
  
  // Listen to typing events
  socket.on('typing:start', () => handleTypingStart(socket));
  socket.on('typing:stop', () => handleTypingStop(socket));
  
  // Listen to disconnect event
  socket.on('disconnect', () => handleUserDisconnect(socket));
};
