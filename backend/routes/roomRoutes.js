// backend/routes/roomRoutes.js
import express from 'express';
import { getAllRooms } from '../controllers/roomController.js';

const router = express.Router();

// Public route - không cần authentication
router.get('/', getAllRooms);

export default router;

