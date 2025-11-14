// backend/controllers/messageController.js
import fs from 'fs';
const DB_FILE = './db.json';

// HÀM 1: Đảm bảo bạn EXPORT hàm này
export const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], messages: [] };
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

// HÀM 2: Hàm này bạn không cần export
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// HÀM 3: Bạn đã có (GET /api/messages)
export const getMessages = (req, res) => {
  const db = readDB();
  res.status(200).json(db.messages);
};

// HÀM 4: Đảm bảo bạn EXPORT hàm này
export const saveMessage = (message) => {
  const db = readDB();
  db.messages.push(message);
  writeDB(db);
  console.log('Message saved:', message);
};