// backend/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/userModel.js'; // <-- Import khuôn User

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// --- CHIẾN LƯỢC GOOGLE (Bạn đã có) ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Pass profile sang cho userController.js xử lý
      return done(null, { profile });
    } catch (error) {
      return done(error, null);
    }
  }));
}

// --- CHIẾN LƯỢC JWT (Thêm vào để bảo vệ API) ---
// Tùy chọn để JwtStrategy trích xuất token
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ 'Bearer <token>'
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    // jwt_payload chứa thông tin (id, username, email)
    // chúng ta đã mã hóa bằng generateToken
    const user = await User.findById(jwt_payload.id);

    if (user) {
      // Nếu tìm thấy user, trả về user
      return done(null, user);
    } else {
      // Nếu không tìm thấy
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

// --- Cấu hình session (Giữ nguyên) ---
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;