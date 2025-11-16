// backend/controllers/roomController.js
import { Room } from '../models/roomModel.js';

/**
 * Lấy danh sách tất cả phòng (công khai)
 */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .select('name createdBy createdAt members')
      .sort({ createdAt: -1 })
      .limit(50); // Giới hạn 50 phòng mới nhất
    
    res.status(200).json({
      rooms: rooms.map(room => ({
        name: room.name,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        memberCount: room.members ? room.members.length : 0
      }))
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách phòng' });
  }
};

