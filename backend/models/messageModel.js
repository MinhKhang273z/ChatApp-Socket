// backend/models/messageModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: false }, // Không bắt buộc nếu có file
  room: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Thông tin file đính kèm
  file: {
    filename: { type: String },
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    url: { type: String }
  }
});

export const Message = mongoose.model('Message', messageSchema);