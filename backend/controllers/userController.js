// backend/controllers/userController.js
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const DB_FILE = './db.json';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Hàm tiện ích để đọc/ghi DB
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], messages: [] };
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Tạo JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Controller cho API đăng ký
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tất cả các trường là bắt buộc' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const db = readDB();
    
    // Kiểm tra username đã tồn tại
    if (db.users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Tên người dùng đã tồn tại' });
    }

    // Kiểm tra email đã tồn tại
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      provider: 'local'
    };

    db.users.push(newUser);
    writeDB(db);

    // Tạo token
    const token = generateToken(newUser);

    res.status(201).json({
      user: {
        id: newUser.id,
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

// Controller cho API đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    const db = readDB();
    const user = db.users.find(u => u.email === email && u.provider === 'local');

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
        id: user.id,
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

// Controller cho Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    // Passport sẽ set req.user là profile object trực tiếp
    const profile = req.user?.profile || req.user;
    
    if (!profile || !profile.emails || !profile.emails[0]) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=google_auth_failed`);
    }

    const db = readDB();
    let user = db.users.find(u => u.email === profile.emails[0].value);

    if (!user) {
      // Tạo user mới từ Google
      user = {
        id: Date.now().toString(),
        username: profile.displayName || profile.emails[0].value.split('@')[0],
        email: profile.emails[0].value,
        password: null,
        createdAt: new Date().toISOString(),
        provider: 'google',
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value || null
      };
      db.users.push(user);
      writeDB(db);
    } else if (user.provider !== 'google') {
      // Cập nhật user hiện có với Google info
      user.provider = 'google';
      user.googleId = profile.id;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      writeDB(db);
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

// Lấy thông tin user hiện tại
export const getCurrentUser = (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};