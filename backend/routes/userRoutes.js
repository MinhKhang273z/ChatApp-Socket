// backend/routes/userRoutes.js
import express from 'express';
import passport from 'passport';
import { register, login, googleCallback, getCurrentUser } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getCurrentUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/auth?error=google_auth_failed' }),
  googleCallback
);

export default router;
