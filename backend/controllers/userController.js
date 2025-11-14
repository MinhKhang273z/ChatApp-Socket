// backend/controllers/userController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js'; // <-- Import khuôn User từ MongoDB

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// (XÓA BỎ các hàm readDB và writeDB dùng 'fs')

// Tạo JWT token
const generateToken = (user) => {
  return jwt.sign(
    // Chuyển user.id (từ Mongoose) thành user._id
    { id: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Controller cho API đăng ký (Đã nâng cấp)
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tất cả các trường là bắt buộc' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra username hoặc email đã tồn tại trong MongoDB
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Tên người dùng đã tồn tại' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới bằng "khuôn" User
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      provider: 'local'
    });

    // Lưu user mới vào MongoDB
    await newUser.save();

    // Tạo token
    const token = generateToken(newUser);

    res.status(201).json({
      user: {
        id: newUser._id, // Dùng _id từ MongoDB
        username: newUser.username,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

// Controller cho API đăng nhập (Đã nâng cấp)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    // Tìm user trong MongoDB
    const user = await User.findOne({ email: email, provider: 'local' });

    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo token
    const token = generateToken(user);

    res.status(200).json({
      user: {
        id: user._id, // Dùng _id từ MongoDB
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

// Controller cho Google OAuth callback (Đã nâng cấp)
export const googleCallback = async (req, res) => {
  try {
    const profile = req.user?.profile || req.user;
    
    if (!profile || !profile.emails || !profile.emails[0]) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=google_auth_failed`);
    }

    const email = profile.emails[0].value;
    let user = await User.findOne({ email: email });

    if (!user) {
      // Tạo user mới từ Google
      user = new User({
        username: profile.displayName || email.split('@')[0],
        email: email,
        provider: 'google',
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value || null
      });
      await user.save(); // Lưu vào MongoDB
    } else if (user.provider !== 'google') {
      // Cập nhật user "local" hiện có với thông tin Google
      user.provider = 'google';
      user.googleId = profile.id;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      await user.save(); // Cập nhật MongoDB
    }

    // Tạo token
    const token = generateToken(user);

    // Redirect về frontend với token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?token=${token}&username=${encodeURIComponent(user.username)}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=google_auth_failed`);
  }
};

// Lấy thông tin user hiện tại (Đã nâng cấp)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user.id được lấy từ token (đã đổi thành _id)
    const user = await User.findById(req.user.id).select('-password'); // Lấy user, bỏ trường password

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};