// backend/server.js 

// --- CẤU HÌNH DOTENV (CHỈ 1 LẦN) ---
import dotenv from 'dotenv';
dotenv.config();

// --- IMPORTS BẮT BUỘC ---
import http from 'http';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

// 🟢 IMPORTS CẦN THIẾT CHO PASSPORT VÀ SESSION
import passport from 'passport'; 
import session from 'express-session'; // Cần import session
import configurePassport from './config/passport.js'; 

// Import handlers và middleware
import { setupSocketListeners, users } from './handlers/socketHandlers.js'; 
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

// --- KẾT NỐI MONGODB ---
const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
  console.error("LỖI NGHIÊM TRỌNG: MONGO_URI không được tìm thấy trong file .env");
  console.error("Hãy đảm bảo file .env tồn tại trong thư mục 'backend' và đã có MONGO_URI.");
  process.exit(1); 
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối thành công tới MongoDB!'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));
// --------------------------------------------------

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration for Socket.io
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ["http://localhost:3000"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- Middleware ---
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// 🟢 CẤU HÌNH SESSION
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-secret-key-for-session', // Đặt secret vào .env
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 giờ
        secure: process.env.NODE_ENV === 'production' // true chỉ khi ở môi trường production
    }
}));

// 🟢 CẤU HÌNH PASSPORT
configurePassport(); 

// Khởi tạo Passport và Session
app.use(passport.initialize()); 
app.use(passport.session()); // RẤT QUAN TRỌNG CHO GOOGLE AUTH

// --- Routes ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', userRoutes);

// Room routes
app.use('/api/rooms', roomRoutes);

/**
 * GET /api/users (Lấy danh sách user đang online)
 */
app.get('/api/users', (req, res) => {
  res.json({
    totalUsers: users.size,
    users: Array.from(users.values()).map(u => ({
      id: u.id,
      username: u.username,
      joinedAt: u.joinedAt
    }))
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  socket.server = io;
  setupSocketListeners(socket);
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});