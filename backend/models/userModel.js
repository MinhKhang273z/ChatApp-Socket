// backend/models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true // Email là duy nhất
  },
  password: { 
    type: String 
    // KHÔNG còn "required" nữa, vì user Google không có
  },
  provider: { 
    type: String, 
    required: true, 
    default: 'local' // 'local' hoặc 'google'
  },
  googleId: { 
    type: String 
  },
  avatar: {
    type: String
  }
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

export const User = mongoose.model('User', userSchema);