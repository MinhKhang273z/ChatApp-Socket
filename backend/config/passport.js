// backend/config/passport.js (Nội dung đã được sửa)

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
// Đổi tên import để tránh nhầm lẫn. User là mô hình Mongoose.
import { User } from '../models/userModel.js'; 

// LƯU Ý: JWT_SECRET sẽ được lấy từ process.env (đã được dotenv load)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'; 

// Hàm cấu hình Passport
const configurePassport = () => {
    
    // --- CHIẾN LƯỢC GOOGLE (Dùng cho đăng nhập và đăng ký qua Google) ---
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Đảm bảo đường dẫn này khớp với route và Google Console
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Sửa logic: Trả về đối tượng profile của Google
                // Logic tìm kiếm/tạo user sẽ được chuyển sang userController
                // để giữ cho passport.js chỉ làm nhiệm vụ xác thực.
                return done(null, { profile, accessToken, refreshToken }); 
            } catch (error) {
                // Lỗi trong quá trình xử lý database (nếu có logic DB ở đây)
                return done(error, null); 
            }
        }));
    }

    // --- CHIẾN LƯỢC JWT (Dùng cho việc bảo vệ API sau khi đăng nhập) ---
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET
    };

    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            // Sử dụng User.findById để tìm user (Giả định User là mô hình Mongoose)
            const user = await User.findById(jwt_payload.id); 

            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            return done(error, false);
        }
    }));

    // --- Cấu hình session (Rất quan trọng cho Google Auth với Session) ---
    // Sửa: Serializer phải lưu một giá trị duy nhất (thường là ID)
    passport.serializeUser((userPayload, done) => {
        // Nếu userPayload là đối tượng { profile }, lưu lại profile
        // Nếu đã là đối tượng user từ DB, lưu lại user.id
        done(null, userPayload); 
    });

    // Sửa: Deserializer phải lấy lại đối tượng người dùng từ giá trị đã lưu
    passport.deserializeUser((userPayload, done) => {
        // Tùy thuộc vào việc serializeUser đã lưu gì, deserializeUser sẽ nhận lại giá trị đó.
        // Nếu bạn đã lưu { profile }, nó sẽ trả về profile cho req.user
        done(null, userPayload);
    });
};

export default configurePassport;