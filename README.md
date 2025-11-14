# 💬 ChatApp-Socket

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js)

**Ứng dụng chat real-time hiện đại với giao tiếp tức thời**

[Giới thiệu](#-giới-thiệu) • [Tính năng](#-tính-năng) • [Cài đặt](#-cài-đặt) • [Sử dụng](#-sử-dụng) • [Công nghệ](#-công-nghệ)

</div>

---

## 📖 Giới thiệu

**ChatApp-Socket** là ứng dụng chat real-time được xây dựng với kiến trúc full-stack hiện đại. Ứng dụng cho phép người dùng giao tiếp tức thời qua WebSocket, hỗ trợ nhiều phòng chat đồng thời với giao diện đẹp mắt và trải nghiệm người dùng mượt mà.

### ✨ Điểm nổi bật

- ⚡ **Real-time messaging** - Giao tiếp tức thời không độ trễ
- 🎨 **Giao diện hiện đại** - UI/UX được thiết kế cẩn thận với Tailwind CSS
- 🔄 **Tự động kết nối lại** - Xử lý mất kết nối thông minh
- 📱 **Responsive** - Hoạt động tốt trên mọi thiết bị
- 🚀 **Hiệu suất cao** - Tối ưu hóa cho trải nghiệm mượt mà

---

## 🚀 Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 💬 **Tin nhắn real-time** | Gửi và nhận tin nhắn tức thời sử dụng Socket.io WebSocket |
| 🏠 **Nhiều phòng chat** | Tạo và tham gia các phòng chat khác nhau |
| 👥 **Hiển thị người dùng** | Xem danh sách người dùng đang online trong phòng |
| ⌨️ **Chỉ báo đang gõ** | Biết khi ai đó đang soạn tin nhắn |
| 🔔 **Thông báo** | Thông báo khi người dùng tham gia/rời phòng |
| 🎯 **Tự động kết nối lại** | Tự động kết nối lại khi mất kết nối mạng |

---

## 📁 Cấu trúc Dự án

```
ChatApp-Socket/
├── 📂 backend/              # Backend Server
│   ├── server.js            # Server chính với Socket.io
│   ├── package.json         # Dependencies backend
│   └── .env.example         # Template biến môi trường
│
├── 📂 frontend/             # Frontend Application
│   ├── 📂 app/              # Next.js App Router
│   │   ├── layout.tsx       # Layout gốc
│   │   ├── page.tsx         # Trang chat chính
│   │   └── globals.css      # Styles toàn cục
│   ├── 📂 components/       # React Components
│   │   ├── ChatRoom.tsx     # Component phòng chat
│   │   ├── LoginForm.tsx    # Form đăng nhập/tham gia
│   │   ├── MessageList.tsx  # Danh sách tin nhắn
│   │   ├── MessageInput.tsx # Input gửi tin nhắn
│   │   └── UserList.tsx      # Danh sách người dùng
│   ├── package.json         # Dependencies frontend
│   └── next.config.js       # Cấu hình Next.js
│
└── package.json             # Root scripts
```

---

## 🛠️ Cài đặt

### Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Bước 1: Clone dự án

```bash
git clone https://github.com/yourusername/ChatApp-Socket.git
cd ChatApp-Socket
```

### Bước 2: Cài đặt dependencies

**Cài đặt tất cả (khuyến nghị):**
```bash
npm run install:all
```

**Hoặc cài đặt riêng lẻ:**
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Bước 3: Cấu hình biến môi trường

**Backend** - Tạo file `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** - Tạo file `frontend/.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 🚀 Sử dụng

### Chế độ Development

**Chạy cả hai server cùng lúc:**
```bash
npm run dev
```

**Hoặc chạy riêng lẻ:**

<details>
<summary><b>Terminal 1 - Backend Server</b></summary>

```bash
npm run dev:backend
# hoặc
cd backend && npm run dev
```
</details>

<details>
<summary><b>Terminal 2 - Frontend Server</b></summary>

```bash
npm run dev:frontend
# hoặc
cd frontend && npm run dev
```
</details>

### Chế độ Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Truy cập ứng dụng

- 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API**: [http://localhost:3001](http://localhost:3001)
- ❤️ **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 🔧 Cấu hình

### Backend Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `PORT` | Cổng server | `3001` |
| `FRONTEND_URL` | URL frontend cho CORS | `http://localhost:3000` |
| `NODE_ENV` | Môi trường | `development` |

### Frontend Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `NEXT_PUBLIC_SOCKET_URL` | URL server Socket.io | `http://localhost:3001` |

---

## 📡 Socket.io Events

### Client → Server

| Event | Payload | Mô tả |
|-------|---------|-------|
| `user:join` | `{username, room}` | Tham gia phòng chat |
| `message:send` | `{text}` | Gửi tin nhắn |
| `typing:start` | - | Bắt đầu chỉ báo đang gõ |
| `typing:stop` | - | Dừng chỉ báo đang gõ |

### Server → Client

| Event | Payload | Mô tả |
|-------|---------|-------|
| `connect` | - | Socket đã kết nối |
| `disconnect` | - | Socket đã ngắt kết nối |
| `error` | `{message}` | Có lỗi xảy ra |
| `room:info` | `{room, users, messages}` | Thông tin phòng |
| `message:receive` | `{id, username, text, timestamp}` | Tin nhắn mới |
| `user:joined` | `{username, message, timestamp}` | Người dùng đã tham gia |
| `user:left` | `{username, message, timestamp}` | Người dùng đã rời |
| `typing:start` | `{username}` | Người dùng bắt đầu gõ |
| `typing:stop` | `{username}` | Người dùng dừng gõ |

---

## 🧪 Kiểm thử

1. Mở nhiều tab/cửa sổ trình duyệt
2. Tham gia cùng một phòng với các username khác nhau
3. Gửi tin nhắn và xác minh giao hàng real-time
4. Kiểm thử chỉ báo đang gõ
5. Kiểm thử thông báo người dùng tham gia/rời

---

## 🛠️ Công nghệ

### Frontend
- **Next.js 14** - React framework với App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.io** - WebSocket library
- **CORS** - Cross-origin resource sharing

---

## 📝 Lưu ý

- ⚠️ Tin nhắn được lưu trong bộ nhớ (không lưu vào database)
- 📊 Tối đa 100 tin nhắn mỗi phòng (tin nhắn cũ sẽ bị xóa)
- 🏠 Hỗ trợ nhiều phòng đồng thời
- 🔄 Tự động kết nối lại khi mất kết nối

---

## 🐛 Xử lý Sự cố

### Vấn đề Kết nối

- ✅ Kiểm tra backend đang chạy trên cổng đúng
- ✅ Xác minh `NEXT_PUBLIC_SOCKET_URL` khớp với URL backend
- ✅ Kiểm tra cài đặt CORS trong backend
- ✅ Đảm bảo firewall cho phép kết nối

### Vấn đề Build

- ✅ Xóa thư mục `.next`: `rm -rf frontend/.next`
- ✅ Xóa `node_modules` và cài đặt lại
- ✅ Kiểm tra phiên bản Node.js (yêu cầu 18+)

---

## 👥 Nhóm Phát triển

Dự án **ChatApp-Socket** được phát triển bởi nhóm phát triển ChatApp-Socket.

### Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng tạo issue hoặc pull request.

---

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép **MIT**. Xem file `LICENSE` để biết thêm chi tiết.

---

## 🔮 Roadmap

- [ ] Lưu trữ database (MongoDB/PostgreSQL)
- [ ] Xác thực người dùng (JWT, OAuth)
- [ ] Tin nhắn riêng tư
- [ ] Chia sẻ file/hình ảnh
- [ ] Phản ứng tin nhắn (emoji reactions)
- [ ] Tìm kiếm tin nhắn
- [ ] Chế độ tối (Dark mode)
- [ ] Voice/Video call

---

<div align="center">

**Được tạo với ❤️ bởi nhóm phát triển ChatApp-Socket**

⭐ Nếu bạn thích dự án này, hãy cho chúng tôi một ngôi sao!

</div>
