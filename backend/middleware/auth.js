// backend/middleware/auth.js
import passport from 'passport';

// Đây chính là middleware 'verifyToken'
// Nó sẽ tự động gọi 'JwtStrategy' mà chúng ta đã định nghĩa trong config
export const verifyToken = passport.authenticate('jwt', { session: false });