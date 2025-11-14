// backend/routes/messageRoutes.js
import express from 'express';
import { getMessages } from '../controllers/messageController.js';

const router = express.Router();

router.get('/', getMessages); // API lấy lịch sử tin nhắn

export default router;