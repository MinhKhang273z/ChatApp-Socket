# Backend Server

Server backend Node.js + Express + Socket.io cho ứng dụng chat.

## Thiết lập

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

3. Chạy development server:
```bash
npm run dev
```

## API Endpoints

- `GET /health` - Endpoint kiểm tra sức khỏe
- `GET /api/users` - Lấy danh sách người dùng đã kết nối

## Socket.io Events

Xem README.md chính để xem tài liệu đầy đủ về Socket.io events.
