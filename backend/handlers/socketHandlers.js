// backend/handlers/socketHandlers.js
/**
 * Socket.io Event Handlers
 * NÂNG CẤP CUỐI: Đã lưu Room (Phòng) vào MongoDB VĨNH VIỄN
 */

import { Message } from '../models/messageModel.js';
import { Room } from '../models/roomModel.js'; 

// Store connected users: Map<socketId, userInfo>
// (Giữ nguyên để quản lý user TRỰC TUYẾN)
export const users = new Map();

/**
 * Helper function: Lấy danh sách user đang online trong 1 phòng
 */
const getOnlineUsersInRoom = (roomName) => {
  return Array.from(users.values())
    .filter(u => u.rooms.has(roomName))
    .map(u => u.username);
};

/**
 * Xử lý khi user tạo phòng mới (ĐÃ NÂNG CẤP)
 * - Sẽ LƯU phòng vào MongoDB
 */
export const handleRoomCreate = async (socket, data) => {
  const { username, room } = data;
  if (!username || !username.trim()) { /* ... */ return; }
  if (!room || !room.trim()) { /* ... */ return; }

  const roomName = room.trim();
  const userName = username.trim();

  try {
    // Kiểm tra phòng trong MONGODB
    const existingRoom = await Room.findOne({ name: roomName });
    if (existingRoom) {
      socket.emit('error', { message: `Phòng "${roomName}" đã tồn tại.` });
      return;
    }

    // (User creation... giữ nguyên)
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

    // Tạo phòng mới trong MONGODB
    const newRoom = new Room({
      name: roomName,
      createdBy: userName
    });
    const savedRoom = await newRoom.save();

    // (Add room to user in-memory... giữ nguyên)
    user.rooms.add(roomName);
    socket.join(roomName);

    // (Emit room:created... giữ nguyên)
    socket.emit('room:created', {
      room: savedRoom.name,
      message: `Đã tạo phòng ${savedRoom.name}`,
      timestamp: new Date()
    });
    
    // (Emit user:joined... giữ nguyên)
    socket.to(roomName).emit('user:joined', { /* ... (như cũ) */ });

    // Gửi thông tin phòng (với 0 tin nhắn)
    socket.emit('room:info', {
      room: savedRoom.name,
      totalUsers: 1, // Chỉ có người tạo
      users: [userName], // Chỉ có người tạo
      messages: [], // Phòng mới, chưa có tin nhắn
      createdBy: savedRoom.createdBy
    });

    // Gọi hàm để lấy danh sách phòng mới nhất từ DB
    await handleGetUserRooms(socket); 

    console.log(`✅ ${userName} created room in DB: ${roomName}`);

  } catch (err) {
    console.error('Lỗi khi tạo phòng:', err);
    // Lỗi "duplicate key" (trùng tên phòng) thường xảy ra ở đây
    if (err.code === 11000) {
      socket.emit('error', { message: `Phòng "${roomName}" đã tồn tại.` });
    } else {
      socket.emit('error', { message: 'Không thể tạo phòng' });
    }
  }
};

/**
 * Xử lý khi user join room (ĐÃ NÂNG CẤP)
 * - Sẽ kiểm tra phòng trong MongoDB
 */
export const handleUserJoin = async (socket, data) => {
  const { username, room } = data;
  if (!username || !username.trim()) { /* ... */ return; }
  if (!room || !room.trim()) { /* ... */ return; }

  const roomName = room.trim();
  const userName = username.trim();

  try {
    // Kiểm tra phòng trong MONGODB
    const roomFromDB = await Room.findOne({ name: roomName });
    if (!roomFromDB) {
      socket.emit('error', { message: `Phòng "${roomName}" không tồn tại.` });
      return;
    }

    // (Get/create user... giữ nguyên)
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

    // (Check if user already in this room in-memory... giữ nguyên)
    if (user.rooms.has(roomName)) {
      // Chỉ cần gọi lại hàm này để lấy thông tin phòng mới nhất
      await handleGetRoomInfo(socket, { room: roomName }); 
      await handleGetUserRooms(socket); // Cập nhật danh sách phòng
      console.log(`✅ ${userName} switched to already joined room: ${roomName}`);
      return;
    }

    // Thêm user vào danh sách "members" trong MONGODB
    await Room.updateOne({ name: roomName }, { $addToSet: { members: userName } });

    // (Add room to user in-memory... giữ nguyên)
    user.rooms.add(roomName);
    socket.join(roomName);
    
    // (Emit user:joined... giữ nguyên)
    socket.to(roomName).emit('user:joined', { /* ... (như cũ) */ });

    // Lấy lịch sử chat và thông tin phòng
    await handleGetRoomInfo(socket, { room: roomName }); 
    await handleGetUserRooms(socket); // Cập nhật danh sách phòng

    console.log(`✅ ${userName} joined room in DB: ${roomName}`);

  } catch (err) {
    console.error("Lỗi khi join phòng:", err);
    socket.emit('error', { message: 'Không thể join phòng' });
  }
};

/**
 * Xử lý khi user gửi message (ĐÃ SỬA LỖI VALIDATION + HỖ TRỢ FILE + REPLY + MENTIONS)
 */
export const handleMessageSend = async (socket, data) => {
  const user = users.get(socket.id);
  if (!user) { return; }
  
  // PHỤC HỒI CODE VALIDATION BỊ THIẾU
  const { text, room, file, replyTo, mentions } = data;
  // Cho phép gửi nếu có text HOẶC file
  if ((!text || !text.trim()) && !file) { return; }
  const roomName = room || Array.from(user.rooms)[0];
  if (!roomName || !user.rooms.has(roomName)) { return; }
  // ------------------------------------

  const message = {
    username: user.username,
    text: text ? text.trim() : '',
    room: roomName,
    timestamp: new Date()
  };

  // Nếu có file, thêm thông tin file
  if (file) {
    message.file = file;
  }

  // Nếu có reply, thêm thông tin reply
  if (replyTo) {
    message.replyTo = replyTo;
  }

  // Nếu có mentions, thêm danh sách mentions
  if (mentions && mentions.length > 0) {
    message.mentions = mentions;
  }
  
  try {
    const newMessage = new Message(message);
    const savedMessage = await newMessage.save();
    const io = socket.server;
    io.to(roomName).emit('message:receive', savedMessage);
    console.log(`💬 ${user.username} in ${roomName}: ${text || '[file]'} (saved to DB)`);
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
  if (!user) { return; }
  const { room } = data;
  if (!room || !room.trim()) { return; }
  
  socket.to(room.trim()).emit('typing:start', { username: user.username });
};

export const handleTypingStop = (socket, data) => { 
  const user = users.get(socket.id);
  if (!user) { return; }
  const { room } = data;
  if (!room || !room.trim()) { return; }
  
  socket.to(room.trim()).emit('typing:stop', { username: user.username });
};

/**
 * Xử lý khi user rời một phòng cụ thể (ĐÃ NÂNG CẤP)
 * - Sẽ XÓA user khỏi danh sách "members" trong MongoDB
 */
export const handleUserLeave = async (socket, data) => {
  const user = users.get(socket.id);
  if (!user) { return; }
  const { room } = data;
  if (!room || !room.trim()) { return; }
  const roomName = room.trim();
  if (!user.rooms.has(roomName)) { return; }

  try {
    // Xóa user khỏi "members" trong MONGODB
    await Room.updateOne({ name: roomName }, { $pull: { members: user.username } });

    // (Remove room from user in-memory... giữ nguyên)
    user.rooms.delete(roomName);
    socket.leave(roomName);

    // (Emit user:left... giữ nguyên)
    socket.to(roomName).emit('user:left', {
      username: user.username,
      message: `${user.username} đã rời phòng`,
      timestamp: new Date(),
      room: roomName
    });

    // Cập nhật danh sách phòng
    await handleGetUserRooms(socket);

    console.log(`🛑 ${user.username} left room in DB: ${roomName}`);

  } catch (err) {
    console.error("Lỗi khi rời phòng:", err);
    socket.emit('error', { message: 'Không thể rời phòng' });
  }
};

/**
 * Xử lý khi user disconnect (Giữ nguyên)
 */
export const handleUserDisconnect = (socket) => {
  const user = users.get(socket.id);
  if (user) {
    // (Logic cũ để emit "user:left" cho tất cả các phòng... giữ nguyên)
    user.rooms.forEach(roomName => {
      socket.to(roomName).emit('user:left', {
        username: user.username,
        message: `${user.username} đã mất kết nối`,
        timestamp: new Date(),
        room: roomName
      });
    });
    users.delete(socket.id);
    console.log(`👋 User disconnected: ${socket.id} (Username: ${user.username})`);
  }
};

/**
 * Xử lý lấy danh sách phòng của user (ĐÃ NÂNG CẤP)
 * - Sẽ LẤY danh sách phòng từ MongoDB
 */
export const handleGetUserRooms = async (socket) => {
  const user = users.get(socket.id);
  if (!user) {
    socket.emit('user:rooms', { rooms: [] });
    return;
  }

  try {
    // Tìm tất cả phòng có "user.username" trong mảng "members"
    const userRooms = await Room.find({ members: user.username }).select('name');
    
    socket.emit('user:rooms', {
      rooms: userRooms.map(r => r.name) // Chỉ trả về mảng tên phòng
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách phòng:", err);
    socket.emit('error', { message: 'Không thể tải danh sách phòng' });
  }
};

/**
 * Xử lý lấy thông tin phòng cụ thể (ĐÃ NÂNG CẤP)
 * - Sẽ LẤY thông tin phòng từ MongoDB
 */
export const handleGetRoomInfo = async (socket, data) => {
  const { room } = data;
  const user = users.get(socket.id);
  if (!user) { return; }
  if (!room || !room.trim()) { return; }
  const roomName = room.trim();
  if (!user.rooms.has(roomName)) { return; } // Phải join (in-memory) rồi mới được lấy info

  try {
    // Lấy thông tin phòng từ MONGODB
    const roomFromDB = await Room.findOne({ name: roomName });
    if (!roomFromDB) {
      socket.emit('error', { message: `Phòng "${roomName}" không tồn tại.` });
      return;
    }

    // Lấy lịch sử chat (giữ nguyên)
    const messageHistory = await Message.find({ room: roomName })
                                       .sort({ timestamp: -1 })
                                       .limit(50)
                                       .sort({ timestamp: 1 });
    
    // Lấy danh sách user ONLINE (từ helper)
    const onlineUsers = getOnlineUsersInRoom(roomName);

    socket.emit('room:info', {
      room: roomFromDB.name,
      totalUsers: onlineUsers.length, // Số user đang online
      users: onlineUsers, // Tên user đang online
      messages: messageHistory,
      createdBy: roomFromDB.createdBy // Lấy người tạo từ DB
    });

  } catch (err) {
      console.error("Lỗi khi lấy thông tin phòng:", err);
      socket.emit('error', { message: 'Không thể tải thông tin phòng' });
  }
};

/**
 * Xử lý khi user xóa phòng (ĐÃ NÂNG CẤP)
 * - Sẽ XÓA phòng và tin nhắn khỏi MongoDB
 */
export const handleRoomDelete = async (socket, data) => {
  const { username, room } = data;
  const user = users.get(socket.id);
  if (!user || user.username !== username) { return; }
  if (!room || !room.trim()) { return; }
  const roomName = room.trim();

  try {
    // Kiểm tra trong MONGODB
    const roomFromDB = await Room.findOne({ name: roomName });
    if (!roomFromDB) {
      socket.emit('error', { message: `Phòng "${roomName}" không tồn tại.` });
      return;
    }

    // Chỉ "createdBy" mới được xóa
    if (roomFromDB.createdBy !== user.username) {
      socket.emit('error', { message: 'Chỉ chủ phòng mới có quyền xóa phòng này.' });
      return;
    }

    // Xóa phòng và tin nhắn khỏi MONGODB
    await Room.deleteOne({ name: roomName });
    await Message.deleteMany({ room: roomName });
    
    // Thông báo cho TẤT CẢ user trong phòng (kể cả người xóa)
    const io = socket.server;
    io.in(roomName).emit('room:deleted', {
      room: roomName,
      message: `Phòng "${roomName}" đã bị xóa bởi chủ phòng.`,
      timestamp: new Date()
    });

    // Buộc tất cả socket rời khỏi phòng (server-side)
    io.socketsLeave(roomName);

    // Xóa phòng khỏi bộ nhớ "in-memory" của TẤT CẢ user
    users.forEach(u => {
      u.rooms.delete(roomName);
    });

    console.log(`🗑️ Room deleted from DB: ${roomName} by ${username}`);

  } catch (err) {
    console.error("Lỗi khi xóa phòng:", err);
    socket.emit('error', { message: 'Không thể xóa phòng' });
  }
};

/**
 * Xử lý thu hồi tin nhắn
 */
export const handleMessageRecall = async (socket, data) => {
  const user = users.get(socket.id);
  if (!user) { return; }
  
  const { messageId, room } = data;
  if (!messageId || !room) { return; }
  
  try {
    // Tìm tin nhắn
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Tin nhắn không tồn tại' });
      return;
    }
    
    // Kiểm tra quyền thu hồi (chỉ người gửi mới được thu hồi)
    if (message.username !== user.username) {
      socket.emit('error', { message: 'Bạn chỉ có thể thu hồi tin nhắn của mình' });
      return;
    }
    
    // Bỏ giới hạn thời gian - cho phép thu hồi bất cứ lúc nào
    
    // Kiểm tra đã thu hồi chưa
    if (message.isRecalled) {
      socket.emit('error', { message: 'Tin nhắn đã được thu hồi' });
      return;
    }
    
    // Xóa file nếu có
    if (message.file && message.file.filename) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.join(__dirname, '../uploads', message.file.filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted file: ${message.file.filename}`);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    // Cập nhật tin nhắn thành đã thu hồi
    message.isRecalled = true;
    message.recalledAt = new Date();
    message.recalledBy = user.username;
    await message.save();
    
    // Broadcast cho tất cả user trong phòng
    const io = socket.server;
    io.to(room).emit('message:recalled', {
      messageId: messageId,
      recalledBy: user.username,
      recalledAt: message.recalledAt
    });
    
    console.log(`🔄 Message recalled: ${messageId} by ${user.username}`);
    console.log('Broadcasting to room:', room, 'with data:', {
      messageId: messageId,
      recalledBy: user.username,
      recalledAt: message.recalledAt
    });
    
  } catch (err) {
    console.error('Lỗi khi thu hồi tin nhắn:', err);
    socket.emit('error', { message: 'Không thể thu hồi tin nhắn' });
  }
};

/**
 * Xử lý reaction emoji
 */
export const handleMessageReaction = async (socket, data) => {
  const user = users.get(socket.id);
  if (!user) { return; }
  
  const { messageId, emoji, room } = data;
  if (!messageId || !emoji || !room) { return; }
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Tin nhắn không tồn tại' });
      return;
    }
    
    // Kiểm tra user đã react với emoji này chưa
    const existingReaction = message.reactions.find(
      r => r.username === user.username && r.emoji === emoji
    );
    
    if (existingReaction) {
      // Nếu đã react, thì remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.username === user.username && r.emoji === emoji)
      );
    } else {
      // Remove reaction cũ của user (nếu có) và thêm reaction mới
      message.reactions = message.reactions.filter(r => r.username !== user.username);
      message.reactions.push({
        emoji: emoji,
        username: user.username,
        timestamp: new Date()
      });
    }
    
    await message.save();
    
    // Broadcast reaction update
    const io = socket.server;
    io.to(room).emit('message:reaction', {
      messageId: messageId,
      reactions: message.reactions
    });
    
    console.log(`😀 Reaction ${emoji} by ${user.username} on message ${messageId}`);
    
  } catch (err) {
    console.error('Lỗi khi xử lý reaction:', err);
    socket.emit('error', { message: 'Không thể thêm reaction' });
  }
};

/**
 * Setup tất cả socket event listeners (Đã thêm recall + reaction)
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
  socket.on('message:recall', (data) => handleMessageRecall(socket, data));
  socket.on('message:reaction', (data) => handleMessageReaction(socket, data));
  socket.on('typing:start', (data) => handleTypingStart(socket, data));
  socket.on('typing:stop', (data) => handleTypingStop(socket, data));
  
  // WebRTC Call Events
  socket.on('call:offer', (data) => handleCallOffer(socket, data));
  socket.on('call:answer', (data) => handleCallAnswer(socket, data));
  socket.on('call:answer-sdp', (data) => handleCallAnswerSDP(socket, data));
  socket.on('call:ice-candidate', (data) => handleCallIceCandidate(socket, data));
  socket.on('call:end', (data) => handleCallEnd(socket, data));
  
  socket.on('disconnect', () => handleUserDisconnect(socket));
};

/**
 * WebRTC Call Handlers
 */
export const handleCallOffer = (socket, data) => {
  const { to, offer, callType, from } = data;
  
  // Find target user's socket
  const targetUser = Array.from(users.values()).find(u => u.username === to);
  
  if (targetUser) {
    socket.to(targetUser.id).emit('call:incoming', {
      from: from,
      offer: offer,
      callType: callType,
    });
    console.log(`📞 Call offer from ${from} to ${to} (${callType})`);
  } else {
    socket.emit('error', { message: 'Người dùng không online' });
  }
};

export const handleCallAnswer = (socket, data) => {
  const { to, accepted } = data;
  
  // Find target user's socket
  const targetUser = Array.from(users.values()).find(u => u.username === to);
  
  if (targetUser) {
    if (accepted) {
      socket.to(targetUser.id).emit('call:answer', { accepted: true });
      console.log(`✅ Call accepted by ${to}`);
    } else {
      socket.to(targetUser.id).emit('call:rejected');
      console.log(`❌ Call rejected by ${to}`);
    }
  }
};

export const handleCallAnswerSDP = (socket, data) => {
  const { to, answer } = data;
  
  // Find target user's socket
  const targetUser = Array.from(users.values()).find(u => u.username === to);
  
  if (targetUser) {
    socket.to(targetUser.id).emit('call:answer-sdp', {
      from: users.get(socket.id)?.username || '',
      answer: answer,
    });
    console.log(`📡 SDP answer sent to ${to}`);
  }
};

export const handleCallIceCandidate = (socket, data) => {
  const { to, candidate } = data;
  const username = users.get(socket.id)?.username || 'unknown';
  
  console.log(`🧊 ICE candidate from ${username} to ${to}`);
  
  // Find target user's socket
  const targetUser = Array.from(users.values()).find(u => u.username === to);
  
  if (targetUser) {
    socket.to(targetUser.id).emit('call:ice-candidate', {
      from: username,
      candidate: candidate,
    });
    console.log(`✅ ICE candidate forwarded to ${to}`);
  } else {
    console.log(`❌ Target user not found: ${to}`);
  }
};

export const handleCallEnd = (socket, data) => {
  const { to } = data;
  
  // Find target user's socket
  const targetUser = Array.from(users.values()).find(u => u.username === to);
  
  if (targetUser) {
    socket.to(targetUser.id).emit('call:ended');
    console.log(`📵 Call ended between users`);
  }
};