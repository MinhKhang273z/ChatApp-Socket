// backend/models/roomModel.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Tên phòng là bắt buộc'],
		unique: true, // Rất quan trọng: Không thể có 2 phòng trùng tên
		trim: true
	},
	createdBy: {
		type: String, // Chúng ta sẽ lưu bằng username (cho đơn giản)
		required: true
	},
	// Chúng ta sẽ lưu danh sách username của các thành viên trong phòng
	members: [{
		type: String 
	}],
	createdAt: {
		type: Date,
		default: Date.now
	}
});

/**
 * Tự động thêm người tạo (createdBy) vào danh sách thành viên (members)
 * khi một phòng mới được tạo.
 */
roomSchema.pre('save', function(next) {
	if (this.isNew && !this.members.includes(this.createdBy)) {
		this.members.push(this.createdBy);
	}
	next();
});

// SỬA CHUẨN: Sử dụng Named Export để khớp với cách import { Room } trong socketHandlers.js
const Room = mongoose.model('Room', roomSchema);
export { Room };