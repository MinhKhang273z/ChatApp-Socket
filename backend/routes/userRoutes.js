// backend/routes/userRoutes.js
import express from 'express';
import { login } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', login); // API đăng nhập

export default router;