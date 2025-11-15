// backend/routes/userRoutes.js (Nội dung đã sửa)

import express from 'express';
import passport from 'passport'; // Chỉ import thư viện chính thức
import { 
    register, 
    login, 
    googleCallback, 
    getCurrentUser 
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// === Public routes ===
router.post('/register', register);
router.post('/login', login);

// === Private route (Bảo vệ bằng token) ===
router.get('/me', verifyToken, getCurrentUser);

// === Google OAuth routes ===

// Bước 1: Chuyển hướng người dùng đến Google
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

// Bước 2: Google gọi lại sau khi xác thực
router.get('/google/callback', 
    // SỬA LỖI: Xóa 'session: false' để dùng session như đã cấu hình trong server.js
    passport.authenticate('google', { 
        failureRedirect: '/auth?error=google_auth_failed' 
    }),
    googleCallback // Gọi controller của bạn để xử lý (ví dụ: tạo JWT và trả về)
);

export default router;