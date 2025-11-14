// backend/handlers/socketHandlers.js
/**
 * Socket.io Event Handlers
 * NÂNG CẤP: Đã kết nối với MongoDB
 */

import { Message } from '../models/messageModel.js'; // <-- Import khuôn Message

export const users = new Map();
export const rooms = new Map();

/**
 * Xử lý khi user tạo phòng mới
 */
export const handleRoomCreate = async (socket, data) => { // Thêm "async"
  const { username, room } = data;
  
  if (!username || !username.trim()) { /* ... */ return; }
  if (!room || !room.trim()) { /* ... */ return; }

  const roomName = room.trim();
  const userName = username.trim();

  if (rooms.has(roomName)) { /* ... */ return; }

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

  if (user.rooms.has(roomName)) { /* ... */ return; }

  rooms.set(roomName, {
    users: [],
    messages: [], // Không còn dùng, nhưng giữ lại
    createdAt: new Date(),
    createdBy: userName
  });

  user.rooms.add(roomName);
  socket.join(roomName);

  const roomData = rooms.get(roomName);
  roomData.users.push({
    id: socket.id,
    username: userName,
    joinedAt: new Date()
  });

  socket.emit('room:created', { /* ... */ });
  socket.to(roomName).emit('user:joined', { /* ... */ });

  // Khi tạo phòng mới, lịch sử chat luôn là mảng rỗng
  socket.emit('room:info', {
    room: roomName,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    messages: [], // Gửi mảng rỗng
    createdBy: roomData.createdBy
  });

  socket.emit('user:rooms', { /* ... */ });
  console.log(`✅ ${userName} created and joined room: ${roomName} ...`);
};

/**
 * Xử lý khi user join room (Đã nâng cấp)
 */
export const handleUserJoin = async (socket, data) => { // Thêm "async"
  const { username, room } = data;
  
  if (!username || !username.trim()) { /* ... */ return; }
  if (!room || !room.trim()) { /* ... */ return; }

  const roomName = room.trim();
  const userName = username.trim();

  if (!rooms.has(roomName)) { /* ... */ return; }

  let user = users.get(socket.id);
  if (!user) { /* ... (Tạo user như cũ) */ }

  try {
    // Check if user already in this room
    if (user.rooms.has(roomName)) {
      const roomData = rooms.get(roomName);
      
      const messageHistory = await Message.find({ room: roomName })
                                         .sort({ timestamp: -1 })
                                         .limit(50)
                                         .sort({ timestamp: 1 });

      socket.emit('room:info', {
        room: roomName,
        totalUsers: roomData.users.length,
        users: roomData.users.map(u => u.username),
        messages: messageHistory, // <-- DÙNG LỊCH SỬ TỪ DB
        createdBy: roomData.createdBy
      });
      
      socket.emit('user:rooms', { /* ... */ });
      console.log(`✅ ${userName} switched to already joined room: ${roomName}`);
      return;
    }

    user.rooms.add(roomName);
    socket.join(roomName);

    const roomData = rooms.get(roomName);
    const existingUserIndex = roomData.users.findIndex(u => u.id === socket.id);
    if (existingUserIndex === -1) { /* ... (Thêm user như cũ) */ }

    socket.to(roomName).emit('user:joined', { /* ... */ });

    // Lấy 50 tin nhắn cuối từ DB
    const messageHistory = await Message.find({ room: roomName })
                                       .sort({ timestamp: -1 })
                                       .limit(50)
                                       .sort({ timestamp: 1 });

    socket.emit('room:info', {
      room: roomName,
      totalUsers: roomData.users.length,
      users: roomData.users.map(u => u.username),
      messages: messageHistory, // <-- DÙNG LỊCH SỬ TỪ DB
      createdBy: roomData.createdBy
    });

    socket.emit('user:rooms', { /* ... */ });
    console.log(`✅ ${userName} join room: ${roomName} ...`);
  
  } catch (err) {
      console.error("Lỗi khi lấy lịch sử chat:", err);
      socket.emit('error', { message: 'Không thể tải lịch sử chat' });
  }
};

/**
 * Xử lý khi user gửi message (ĐÃ NÂNG CẤP và SỬA LỖI)
 */
export const handleMessageSend = async (socket, data) => { // Thêm "async"
  const user = users.get(socket.id);
  
  if (!user) { return; }
  const { text, room } = data;
  if (!text || !text.trim()) { return; }
  const roomName = room || Array.from(user.rooms)[0];
  if (!roomName || !user.rooms.has(roomName)) { return; }

  const message = {
    // Xóa: id: `${socket.id}-${Date.now()}`, // MongoDB sẽ tự tạo _id
    username: user.username,
    text: text.trim(),
    room: roomName,
    timestamp: new Date()
  };

  try {
    // 1. Tạo tin nhắn mới
    const newMessage = new Message(message);
    
    // 2. Lưu vào MongoDB và lấy kết quả trả về
    const savedMessage = await newMessage.save();

    // 3. Broadcast tin nhắn ĐÃ LƯU (có _id) tới tất cả users
    const io = socket.server;
    io.to(roomName).emit('message:receive', savedMessage); // <-- SỬA LỖI: Gửi "savedMessage"
    
    console.log(`💬 ${user.username} in ${roomName}: ${text} (saved to DB)`);

  } catch (err) {
    console.error('Lỗi khi lưu tin nhắn:', err);
    socket.emit('error', { message: 'Không thể gửi tin nhắn' });
  }
};

/**
 * Xử lý typing indicator (Giữ nguyên)
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
 * Xử lý typing indicator (Giữ nguyên)
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
 * Xử lý khi user rời một phòng cụ thể (Giữ nguyên)
 */
export const handleUserLeave = (socket, data) => {
  // (Code cũ của bạn giữ nguyên)
  const user = users.get(socket.id);
  if (!user) { return; }
  // ...
};

/**
 * Xử lý khi user disconnect (Giữ nguyên)
 */
export const handleUserDisconnect = (socket) => {
  // (Code cũ của bạn giữ nguyên)
  const user = users.get(socket.id);
  if (user) { /* ... */ }
};

/**
 * Xử lý lấy danh sách phòng của user (Giữ nguyên)
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
 * Xử lý lấy thông tin phòng cụ thể (Đã nâng cấp)
 */
export const handleGetRoomInfo = async (socket, data) => { // Thêm "async"
  const { room } = data;
  const user = users.get(socket.id);
  
  if (!user) { return; }
  if (!room || !room.trim()) { return; }
  const roomName = room.trim();
  if (!user.rooms.has(roomName)) { return; }
  if (!rooms.has(roomName)) { return; }

  try {
    const roomData = rooms.get(roomName);
    
    // Lấy 50 tin nhắn cuối từ DB
    const messageHistory = await Message.find({ room: roomName })
                                       .sort({ timestamp: -1 })
                                       .limit(50)
                                       .sort({ timestamp: 1 });
    
    socket.emit('room:info', {
      room: roomName,
      totalUsers: roomData.users.length,
      users: roomData.users.map(u => u.username),
      messages: messageHistory, // <-- DÙNG LỊCH SỬ TỪ DB
      createdBy: roomData.createdBy
    });

  } catch (err) {
      console.error("Lỗi khi lấy thông tin phòng:", err);
      socket.emit('error', { message: 'Không thể tải thông tin phòng' });
  }
};

/**
 * Xử lý khi user xóa phòng (Giữ nguyên)
 */
export const handleRoomDelete = (socket, data) => {
  // (Code cũ của bạn giữ nguyên)
  const { username, room } = data;
  if (!username || !username.trim()) { /* ... */ return; }
  // ...
};

/**
 * Setup tất cả socket event listeners (Giữ nguyên)
 */
export const setupSocketListeners = (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  socket.on('room:create', (data) => handleRoomCreate(socket, data));
  socket.on('room:delete', (data) => handleRoomDelete(socket, data));
  socket.on('user:join', (data) => handleUserJoin(socket, data));
  socket.on('user:leave', (data) => handleUserLeave(socket, data));
  socket.on('user:getRooms', () => handleGetUserRooms(socket));
  socket.on('user:getRoomInfo', (data) => handleGetRoomInfo(socket, data));
  socket.on('message:send', (data) => handleMessageSend(socket, data));
  socket.on('typing:start', (data) => handleTypingStart(socket, data));
  socket.on('typing:stop', (data) => handleTypingStop(socket, data));
  socket.on('disconnect', () => handleUserDisconnect(socket));
};