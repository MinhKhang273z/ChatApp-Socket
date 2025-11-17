// backend/routes/messageRoutes.js
import express from 'express';
import { upload } from '../config/multer.js';
import { Message } from '../models/messageModel.js';

const router = express.Router();

/**
 * POST /api/messages/upload
 * Upload file và tạo message với file đính kèm
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { username, room, text } = req.body;
    
    if (!username || !room) {
      return res.status(400).json({ error: 'Username và room là bắt buộc' });
    }

    if (!req.file && !text) {
      return res.status(400).json({ error: 'Phải có ít nhất text hoặc file' });
    }

    // Tạo message object
    const messageData = {
      username,
      room,
      text: text || '',
      timestamp: new Date()
    };

    // Nếu có file, thêm thông tin file
    if (req.file) {
      messageData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };
    }

    // Lưu vào database
    const newMessage = new Message(messageData);
    const savedMessage = await newMessage.save();

    res.status(201).json({
      success: true,
      message: savedMessage
    });

  } catch (error) {
    console.error('Lỗi khi upload file:', error);
    res.status(500).json({ error: 'Không thể upload file' });
  }
});

export default router;
