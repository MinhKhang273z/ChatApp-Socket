# 💬 Ứng dụng Chat - Full Stack Real-time Messaging

Ứng dụng chat real-time hiện đại được xây dựng với Next.js (frontend) và Node.js + Express + Socket.io (backend).

## 🚀 Tính năng

- **Tin nhắn real-time** - Gửi tin nhắn tức thời sử dụng Socket.io
- **Nhiều phòng chat** - Tham gia các phòng chat khác nhau
- **Hiển thị người dùng** - Xem ai đang online trong phòng của bạn
- **Chỉ báo đang gõ** - Biết khi ai đó đang gõ
- **Giao diện hiện đại** - Thiết kế đẹp, responsive với Tailwind CSS
- **Tự động kết nối lại** - Tự động kết nối lại nếu mất kết nối

## 📁 Cấu trúc Dự án

```
appchat-socket/
├── backend/                 # Node.js + Express + Socket.io backend
│   ├── server.js           # File server chính
│   ├── package.json        # Dependencies backend
│   └── .env.example        # Template biến môi trường
│
├── frontend/               # Next.js frontend
│   ├── app/                # Thư mục app Next.js
│   │   ├── layout.tsx      # Layout gốc
│   │   ├── page.tsx        # Trang chat chính
│   │   └── globals.css     # Styles toàn cục
│   ├── components/         # React components
│   │   ├── ChatRoom.tsx    # Component phòng chat chính
│   │   ├── LoginForm.tsx   # Form đăng nhập/tham gia
│   │   ├── MessageList.tsx # Hiển thị tin nhắn
│   │   ├── MessageInput.tsx # Input tin nhắn
│   │   └── UserList.tsx    # Danh sách người dùng online
│   ├── package.json        # Dependencies frontend
│   └── next.config.js      # Cấu hình Next.js
│
├── package.json            # Root package.json với scripts
└── README.md              # File này
```

## 🛠️ Cài đặt

### Yêu cầu

- Node.js 18+ và npm
- Git

### Các bước thiết lập

1. **Clone hoặc điều hướng đến thư mục dự án**
   ```bash
   cd appchat-socket
   ```

2. **Cài đặt tất cả dependencies**
   ```bash
   npm run install:all
   ```
   
   Hoặc cài đặt riêng lẻ:
   ```bash
   # Cài đặt dependencies root
   npm install
   
   # Cài đặt dependencies backend
   cd backend && npm install && cd ..
   
   # Cài đặt dependencies frontend
   cd frontend && npm install && cd ..
   ```

3. **Cấu hình biến môi trường**

   **Backend** (`backend/.env`):
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

## 🚀 Chạy Ứng dụng

### Chế độ Development

**Tùy chọn 1: Chạy cả hai server cùng lúc**
```bash
npm run dev
```

**Tùy chọn 2: Chạy riêng lẻ**

Terminal 1 (Backend):
```bash
npm run dev:backend
# hoặc
cd backend && npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
# hoặc
cd frontend && npm run dev
```

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

## 🌐 Truy cập Ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📡 Socket.io Events

### Client → Server

- `user:join` - Tham gia phòng với username
  ```js
  socket.emit('user:join', { username: 'John', room: 'general' })
  ```

- `message:send` - Gửi tin nhắn
  ```js
  socket.emit('message:send', { text: 'Hello!' })
  ```

- `typing:start` - Bắt đầu chỉ báo đang gõ
  ```js
  socket.emit('typing:start')
  ```

- `typing:stop` - Dừng chỉ báo đang gõ
  ```js
  socket.emit('typing:stop')
  ```

### Server → Client

- `connect` - Socket đã kết nối
- `disconnect` - Socket đã ngắt kết nối
- `error` - Có lỗi xảy ra
- `room:info` - Thông tin phòng (users, messages)
- `message:receive` - Nhận tin nhắn mới
- `user:joined` - Người dùng đã tham gia phòng
- `user:left` - Người dùng đã rời phòng
- `typing:start` - Người dùng bắt đầu gõ
- `typing:stop` - Người dùng dừng gõ

## 🚢 Triển khai (Deployment)

### Deploy Frontend lên Vercel

1. **Cài đặt Vercel CLI** (nếu chưa cài)
   ```bash
   npm i -g vercel
   ```

2. **Điều hướng đến thư mục frontend**
   ```bash
   cd frontend
   ```

3. **Deploy lên Vercel**
   ```bash
   vercel
   ```
   
   Làm theo hướng dẫn:
   - Link to existing project or create new
   - Confirm project settings
   - Deploy

4. **Thiết lập Biến Môi trường trong Vercel Dashboard**
   - Vào settings dự án của bạn
   - Điều hướng đến "Environment Variables"
   - Thêm: `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url.railway.app`

5. **Redeploy** sau khi thiết lập biến môi trường

### Deploy Backend lên Railway

1. **Cài đặt Railway CLI** (nếu chưa cài)
   ```bash
   npm i -g @railway/cli
   ```

2. **Đăng nhập Railway**
   ```bash
   railway login
   ```

3. **Khởi tạo dự án Railway**
   ```bash
   cd backend
   railway init
   ```

4. **Thiết lập Biến Môi trường**
   ```bash
   railway variables set FRONTEND_URL=https://your-frontend-url.vercel.app
   railway variables set PORT=3001
   railway variables set NODE_ENV=production
   ```

   Hoặc sử dụng Railway dashboard:
   - Vào dự án của bạn
   - Click vào tab "Variables"
   - Thêm biến môi trường

5. **Deploy**
   ```bash
   railway up
   ```

6. **Lấy Railway URL của bạn**
   - Railway sẽ cung cấp URL như: `https://your-app.up.railway.app`
   - Cập nhật `NEXT_PUBLIC_SOCKET_URL` của frontend thành URL này

### Tùy chọn: Deploy qua GitHub

**Vercel (Frontend):**
1. Push code lên GitHub
2. Import dự án trong Vercel dashboard
3. Thiết lập biến môi trường
4. Deploy

**Railway (Backend):**
1. Push code lên GitHub
2. Tạo dự án mới trong Railway
3. Kết nối GitHub repository
4. Đặt root directory thành `backend`
5. Thiết lập biến môi trường
6. Deploy

## 🔧 Cấu hình

### Cấu hình Backend

- `PORT` - Cổng server (mặc định: 3001)
- `FRONTEND_URL` - URL frontend cho CORS (mặc định: http://localhost:3000)
- `NODE_ENV` - Môi trường (development/production)

### Cấu hình Frontend

- `NEXT_PUBLIC_SOCKET_URL` - URL server Socket.io backend

## 🧪 Kiểm thử

1. Mở nhiều tab/cửa sổ trình duyệt
2. Tham gia cùng một phòng với các username khác nhau
3. Gửi tin nhắn và xác minh giao hàng real-time
4. Kiểm thử chỉ báo đang gõ
5. Kiểm thử thông báo người dùng tham gia/rời

## 📝 Lưu ý

- Tin nhắn được lưu trong bộ nhớ (không lưu vào database)
- Tối đa 100 tin nhắn mỗi phòng (tin nhắn cũ sẽ bị xóa)
- Hỗ trợ nhiều phòng đồng thời
- Tự động kết nối lại khi mất kết nối

## 🐛 Xử lý Sự cố

### Vấn đề Kết nối

- Kiểm tra backend đang chạy trên cổng đúng
- Xác minh `NEXT_PUBLIC_SOCKET_URL` khớp với URL backend
- Kiểm tra cài đặt CORS trong backend
- Đảm bảo firewall cho phép kết nối

### Vấn đề Build

- Xóa thư mục `.next`: `rm -rf frontend/.next`
- Xóa `node_modules` và cài đặt lại
- Kiểm tra phiên bản Node.js (yêu cầu 18+)

## 📄 Giấy phép

MIT

## 👨‍💻 Phát triển

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Real-time**: Socket.io WebSockets

### Cải tiến Tương lai

- [ ] Lưu trữ database (MongoDB/PostgreSQL)
- [ ] Xác thực người dùng
- [ ] Tin nhắn riêng tư
- [ ] Chia sẻ file/hình ảnh
- [ ] Phản ứng tin nhắn
- [ ] Tìm kiếm tin nhắn
- [ ] Bật/tắt chế độ tối
