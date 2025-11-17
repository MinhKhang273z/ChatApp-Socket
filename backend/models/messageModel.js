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
  },
  // Trạng thái tin nhắn
  isRecalled: { type: Boolean, default: false },
  recalledAt: { type: Date },
  recalledBy: { type: String },
  // Reply/Quote tin nhắn
  replyTo: {
    messageId: { type: String },
    username: { type: String },
    text: { type: String },
    file: {
      filename: { type: String },
      originalName: { type: String },
      mimetype: { type: String }
    }
  },
  // Reactions (emoji)
  reactions: [{
    emoji: { type: String, required: true },
    username: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  // Mentions (@tag)
  mentions: [{ type: String }] // Array of usernames được mention
});

export const Message = mongoose.model('Message', messageSchema);