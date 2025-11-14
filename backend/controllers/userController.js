// backend/controllers/userController.js
import fs from 'fs';
const DB_FILE = './db.json';

// Hàm tiện ích để đọc/ghi DB (bạn có thể tách ra file riêng)
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

// Controller cho API đăng nhập
export const login = (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const db = readDB();
  let user = db.users.find(u => u.username === username);

  if (!user) {
    user = { id: Date.now().toString(), username };
    db.users.push(user);
    writeDB(db);
  }

  res.status(200).json(user);
};