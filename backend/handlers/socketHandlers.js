/**
 * Socket.io Event Handlers
 * Xử lý tất cả socket events: join, leave, messages, typing...
 */

// Store connected users: Map<socketId, userInfo>
// userInfo: { id, username, rooms: Set<roomName>, joinedAt }
export const users = new Map();

// Store rooms: Map<roomName, Array<userInfo>>
export const rooms = new Map();

/**
 * Xử lý khi user tạo phòng mới
 * Events:
 * - Tạo phòng mới nếu chưa tồn tại
 * - Emit 'room:created' thông báo tạo phòng thành công
 * - Tự động join vào phòng vừa tạo
 */
export const handleRoomCreate = (socket, data) => {
  const { username, room } = data;
  
  // Validate input
  if (!username || !username.trim()) {
    socket.emit('error', { message: 'Username không được để trống' });
    return;
  }
  
  if (!room || !room.trim()) {
    socket.emit('error', { message: 'Tên phòng không được để trống' });
    return;
  }

  const roomName = room.trim();
  const userName = username.trim();

  // Check if room already exists
  if (rooms.has(roomName)) {
    socket.emit('error', { message: `Phòng "${roomName}" đã tồn tại. Vui lòng chọn tên khác.` });
    return;
  }

  // Get or create user info
  let user = users.get(socket.id);
  if (!user) {
    user = {
      id: socket.id,
      username: userName,
      rooms: new Set(),
      joinedAt: new Date()
    };
    users.set(socket.id, user);
  }

  // Check if user already in this room
  if (user.rooms.has(roomName)) {
    socket.emit('error', { message: `Bạn đã ở trong phòng ${roomName} rồi` });
    return;
  }

  // Create new room
  rooms.set(roomName, {
    users: [],
    messages: [],
    createdAt: new Date(),
    createdBy: userName
  });

  // Add room to user's rooms
  user.rooms.add(roomName);

  // Join socket vào room
  socket.join(roomName);

  // Add user to room's user list
  const roomData = rooms.get(roomName);
  roomData.users.push({
    id: socket.id,
    username: userName,
    joinedAt: new Date()
  });

  // Thông báo tạo phòng thành công
  socket.emit('room:created', {
    room: roomName,
    message: `Phòng "${roomName}" đã được tạo thành công!`,
    timestamp: new Date()
  });

  // Thông báo các users khác: có user mới join
  socket.to(roomName).emit('user:joined', {
    username: userName,
    message: `${userName} đã vào phòng chat`,
    timestamp: new Date(),
    totalUsersInRoom: roomData.users.length,
    room: roomName
  });

  // Gửi room info cho user vừa join
  socket.emit('room:info', {
    room: roomName,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    messages: roomData.messages.slice(-50), // Last 50 messages
    createdBy: roomData.createdBy
  });

  // Gửi danh sách phòng của user
  socket.emit('user:rooms', {
    rooms: Array.from(user.rooms)
  });

  console.log(`✅ ${userName} created and joined room: ${roomName} (Total rooms: ${user.rooms.size}, Users in room: ${roomData.users.length})`);
};

/**
 * Xử lý khi user join room (chỉ cho phép join phòng đã tồn tại)
 * Events:
 * - Emit 'user:joined' cho các users khác trong room
 * - Emit 'room:info' về room info cho user vừa join
 * - Hỗ trợ user join nhiều phòng cùng lúc
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

  const roomName = room.trim();
  const userName = username.trim();

  // Check if room exists
  if (!rooms.has(roomName)) {
    socket.emit('error', { message: `Phòng "${roomName}" không tồn tại. Vui lòng tạo phòng trước hoặc kiểm tra lại tên phòng.` });
    return;
  }

  // Get or create user info
  let user = users.get(socket.id);
  if (!user) {
    user = {
      id: socket.id,
      username: userName,
      rooms: new Set(),
      joinedAt: new Date()
    };
    users.set(socket.id, user);
  }

  // Check if user already in this room - allow switching to already joined room
  if (user.rooms.has(roomName)) {
    // User already in room, just send room info (allow switching to already joined room)
    const roomData = rooms.get(roomName);
    socket.emit('room:info', {
      room: roomName,
      totalUsers: roomData.users.length,
      users: roomData.users.map(u => u.username),
      messages: roomData.messages.slice(-50), // Last 50 messages
      createdBy: roomData.createdBy
    });
    // Also send user rooms list
    socket.emit('user:rooms', {
      rooms: Array.from(user.rooms)
    });
    console.log(`✅ ${userName} switched to already joined room: ${roomName}`);
    return;
  }

  // Add room to user's rooms
  user.rooms.add(roomName);

  // Join socket vào room
  socket.join(roomName);

  // Add user to room's user list
  const roomData = rooms.get(roomName);
  // Check if user already in room's user list
  const existingUserIndex = roomData.users.findIndex(u => u.id === socket.id);
  if (existingUserIndex === -1) {
    roomData.users.push({
      id: socket.id,
      username: userName,
      joinedAt: new Date()
    });
  }

  // Thông báo các users khác: có user mới join
  socket.to(roomName).emit('user:joined', {
    username: userName,
    message: `${userName} đã vào phòng chat`,
    timestamp: new Date(),
    totalUsersInRoom: roomData.users.length,
    room: roomName
  });

  // Gửi room info cho user vừa join
  socket.emit('room:info', {
    room: roomName,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    messages: roomData.messages.slice(-50), // Last 50 messages
    createdBy: roomData.createdBy
  });

  // Gửi danh sách phòng của user
  socket.emit('user:rooms', {
    rooms: Array.from(user.rooms)
  });

  console.log(`✅ ${userName} join room: ${roomName} (Total rooms: ${user.rooms.size}, Users in room: ${roomData.users.length})`);
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

  const { text, room } = data;
  
  if (!text || !text.trim()) {
    socket.emit('error', { message: 'Tin nhắn không được để trống' });
    return;
  }

  const roomName = room || Array.from(user.rooms)[0]; // Use specified room or first room
  if (!roomName || !user.rooms.has(roomName)) {
    socket.emit('error', { message: 'Bạn không ở trong phòng này' });
    return;
  }

  const message = {
    id: `${socket.id}-${Date.now()}`,
    username: user.username,
    text: text.trim(),
    room: roomName,
    timestamp: new Date()
  };

  // Store message in room
  const roomData = rooms.get(roomName);
  if (roomData) {
    roomData.messages.push(message);
    
    // Keep only last 100 messages per room (tránh memory leak)
    if (roomData.messages.length > 100) {
      roomData.messages.shift();
    }
  }

  // Broadcast message tới tất cả users trong room
  const io = socket.server;
  io.to(roomName).emit('message:receive', message);
  
  console.log(`💬 ${user.username} in ${roomName}: ${text}`);
};

/**
 * Xử lý typing indicator - khi user bắt đầu gõ
 * Events:
 * - Emit 'typing:start' cho các users khác
 */
export const handleTypingStart = (socket, data) => {
  const user = users.get(socket.id);
  if (user) {
    const roomName = data?.room || Array.from(user.rooms)[0];
    if (roomName && user.rooms.has(roomName)) {
      socket.to(roomName).emit('typing:start', {
        username: user.username,
        room: roomName
      });
    }
  }
};

/**
 * Xử lý typing indicator - khi user dừng gõ
 * Events:
 * - Emit 'typing:stop' cho các users khác
 */
export const handleTypingStop = (socket, data) => {
  const user = users.get(socket.id);
  if (user) {
    const roomName = data?.room || Array.from(user.rooms)[0];
    if (roomName && user.rooms.has(roomName)) {
      socket.to(roomName).emit('typing:stop', {
        username: user.username,
        room: roomName
      });
    }
  }
};

/**
 * Xử lý khi user rời một phòng cụ thể
 * Events:
 * - Emit 'user:left' thông báo các users khác
 * - Xóa user khỏi room
 */
export const handleUserLeave = (socket, data) => {
  const user = users.get(socket.id);
  
  if (!user) {
    socket.emit('error', { message: 'User không tồn tại' });
    return;
  }

  const { room } = data;
  if (!room || !room.trim()) {
    socket.emit('error', { message: 'Room không được để trống' });
    return;
  }

  const roomName = room.trim();
  
  if (!user.rooms.has(roomName)) {
    socket.emit('error', { message: 'Bạn không ở trong phòng này' });
    return;
  }

  // Remove room from user's rooms
  user.rooms.delete(roomName);
  
  // Leave socket room
  socket.leave(roomName);

  // Remove user from room's user list
  const roomData = rooms.get(roomName);
  if (roomData) {
    const index = roomData.users.findIndex(u => u.id === socket.id);
    if (index > -1) {
      roomData.users.splice(index, 1);
    }

    // Thông báo users khác: user này đã rời khỏi
    const io = socket.server;
    io.to(roomName).emit('user:left', {
      username: user.username,
      message: `${user.username} đã rời khỏi phòng chat`,
      timestamp: new Date(),
      totalUsersInRoom: roomData.users.length,
      room: roomName
    });

    // NOTE: Room is NOT deleted when empty - rooms persist until explicitly deleted by owner
    // This allows users to refresh the page without losing their rooms
    if (roomData.users.length === 0) {
      console.log(`ℹ️  Room ${roomName} is now empty but will persist`);
    }
  }

  // Gửi danh sách phòng cập nhật cho user
  socket.emit('user:rooms', {
    rooms: Array.from(user.rooms)
  });

  // Gửi thông báo rời phòng thành công
  socket.emit('room:left', {
    room: roomName,
    remainingRooms: Array.from(user.rooms)
  });

  console.log(`👋 ${user.username} left room: ${roomName} (Remaining rooms: ${user.rooms.size})`);
};

/**
 * Xử lý khi user disconnect (rời khỏi tất cả phòng)
 * Events:
 * - Emit 'user:left' thông báo các users khác trong tất cả phòng
 * - Xóa user khỏi users map
 * - Xóa user khỏi tất cả rooms
 */
export const handleUserDisconnect = (socket) => {
  const user = users.get(socket.id);
  
  if (user) {
    const io = socket.server;
    
    // Xử lý từng phòng mà user đang tham gia
    user.rooms.forEach(roomName => {
      const roomData = rooms.get(roomName);
      if (roomData) {
        // Remove user from room's user list
        const index = roomData.users.findIndex(u => u.id === socket.id);
        if (index > -1) {
          roomData.users.splice(index, 1);
        }

        // Thông báo users khác: user này đã rời khỏi
        io.to(roomName).emit('user:left', {
          username: user.username,
          message: `${user.username} đã rời khỏi phòng chat`,
          timestamp: new Date(),
          totalUsersInRoom: roomData.users.length,
          room: roomName
        });

        // NOTE: Room is NOT deleted when empty - rooms persist until explicitly deleted by owner
        // This allows users to refresh the page without losing their rooms
        if (roomData.users.length === 0) {
          console.log(`ℹ️  Room ${roomName} is now empty but will persist`);
        }
      }
    });

    users.delete(socket.id);
    console.log(`❌ ${user.username} disconnected (from ${user.rooms.size} room(s))`);
  } else {
    console.log(`❌ User ${socket.id} disconnected`);
  }
};

/**
 * Xử lý lấy danh sách phòng của user
 */
export const handleGetUserRooms = (socket) => {
  const user = users.get(socket.id);
  if (user) {
    socket.emit('user:rooms', {
      rooms: Array.from(user.rooms)
    });
  } else {
    socket.emit('user:rooms', {
      rooms: []
    });
  }
};

/**
 * Xử lý lấy thông tin phòng cụ thể
 */
export const handleGetRoomInfo = (socket, data) => {
  const { room } = data;
  const user = users.get(socket.id);
  
  if (!user) {
    socket.emit('error', { message: 'User không tồn tại' });
    return;
  }
  
  if (!room || !room.trim()) {
    socket.emit('error', { message: 'Room không được để trống' });
    return;
  }
  
  const roomName = room.trim();
  
  // Check if user is in this room
  if (!user.rooms.has(roomName)) {
    socket.emit('error', { message: `Bạn chưa tham gia phòng ${roomName}` });
    return;
  }
  
  // Check if room exists
  if (!rooms.has(roomName)) {
    socket.emit('error', { message: `Phòng "${roomName}" không tồn tại` });
    return;
  }
  
  const roomData = rooms.get(roomName);
  
  // Send room info
  socket.emit('room:info', {
    room: roomName,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    messages: roomData.messages.slice(-50), // Last 50 messages
    createdBy: roomData.createdBy
  });
};

/**
 * Xử lý khi user xóa phòng (chỉ chủ phòng mới có thể xóa)
 */
export const handleRoomDelete = (socket, data) => {
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

  const roomName = room.trim();
  const userName = username.trim();

  // Check if room exists
  if (!rooms.has(roomName)) {
    socket.emit('error', { message: `Phòng "${roomName}" không tồn tại` });
    return;
  }

  const roomData = rooms.get(roomName);

  // Check if user is the room owner
  if (roomData.createdBy !== userName) {
    socket.emit('error', { message: 'Chỉ có chủ phòng mới có thể xóa phòng này' });
    return;
  }

  const io = socket.server;
  
  // Get all socket IDs of users in the room
  const socketIdsInRoom = roomData.users.map(u => u.id);
  
  // Remove room from all users' room lists and notify them
  socketIdsInRoom.forEach((socketId) => {
    const user = users.get(socketId);
    if (user && user.rooms.has(roomName)) {
      user.rooms.delete(roomName);
      // Update user's room list
      io.to(socketId).emit('user:rooms', {
        rooms: Array.from(user.rooms)
      });
    }
  });

  // Notify all users in the room that it was deleted
  io.to(roomName).emit('room:deleted', {
    room: roomName,
    message: `Phòng "${roomName}" đã bị xóa bởi chủ phòng`,
    timestamp: new Date()
  });

  // Leave all sockets from the room
  io.socketsLeave(roomName);

  // Delete the room
  rooms.delete(roomName);

  console.log(`🗑️  ${userName} deleted room: ${roomName}`);
};

/**
 * Setup tất cả socket event listeners
 * Gọi hàm này khi có user connect
 */
export const setupSocketListeners = (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  // Listen to room:create event (tạo phòng mới)
  socket.on('room:create', (data) => handleRoomCreate(socket, data));
  
  // Listen to room:delete event (xóa phòng - chỉ chủ phòng)
  socket.on('room:delete', (data) => handleRoomDelete(socket, data));
  
  // Listen to user:join event (tham gia phòng đã tồn tại)
  socket.on('user:join', (data) => handleUserJoin(socket, data));
  
  // Listen to user:leave event
  socket.on('user:leave', (data) => handleUserLeave(socket, data));
  
  // Listen to user:getRooms event
  socket.on('user:getRooms', () => handleGetUserRooms(socket));
  
  // Listen to user:getRoomInfo event
  socket.on('user:getRoomInfo', (data) => handleGetRoomInfo(socket, data));
  
  // Listen to message:send event
  socket.on('message:send', (data) => handleMessageSend(socket, data));
  
  // Listen to typing events
  socket.on('typing:start', (data) => handleTypingStart(socket, data));
  socket.on('typing:stop', (data) => handleTypingStop(socket, data));
  
  // Listen to disconnect event
  socket.on('disconnect', () => handleUserDisconnect(socket));
};
