import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport.js';
import mongoose from 'mongoose'; // <-- TÔI ĐÃ THÊM DÒNG NÀY

// Import handlers và middleware
import { setupSocketListeners, users, rooms } from './handlers/socketHandlers.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

// --- KẾT NỐI MONGODB (TÔI ĐÃ DI CHUYỂN LÊN ĐÂY) ---
// LƯU Ý: Sửa lại "cluster0.xxxxx.mongodb.net" cho đúng với địa chỉ của bạn
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://phongnt0023_db_user:nE1JzK2vvkYoelE2@cluster0.xjjv2nb.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối thành công tới MongoDB!'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));
// --------------------------------------------------

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', userRoutes);

/**
 * GET /api/users
 * Trả về danh sách tất cả users đang online
 */
app.get('/api/users', (req, res) => {
  res.json({
    totalUsers: users.size,
    users: Array.from(users.values()).map(u => ({
      id: u.id,
      username: u.username,
      room: u.room,
      joinedAt: u.joinedAt
    }))
  });
});

/**
 * GET /api/rooms
 * Trả về danh sách tất cả rooms và info
 */
app.get('/api/rooms', (req, res) => {
  const roomsData = Array.from(rooms.entries()).map(([roomName, roomData]) => ({
    name: roomName,
    totalUsers: roomData.users.length,
    users: roomData.users.map(u => u.username),
    totalMessages: roomData.messages.length
  }));

  res.json({
    totalRooms: rooms.size,
    rooms: roomsData
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Attach io instance to socket (dùng trong handlers)
  socket.server = io;

  // Setup tất cả socket listeners
  setupSocketListeners(socket);
});

// Error handling middleware (phải ở cuối các routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});