# 🚀 Hướng dẫn Triển khai

Hướng dẫn đầy đủ để triển khai ứng dụng chat lên Vercel (frontend) và Railway (backend).

## 📋 Yêu cầu

- Tài khoản GitHub
- Tài khoản Vercel (có gói miễn phí)
- Tài khoản Railway (có gói miễn phí)
- Git đã cài đặt trên máy

## 🎯 Tổng quan Triển khai

- **Frontend (Next.js)** → Vercel
- **Backend (Node.js + Socket.io)** → Railway

## 🌐 Bước 1: Triển khai Backend lên Railway

### Tùy chọn A: Sử dụng Railway CLI

1. **Cài đặt Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Đăng nhập Railway**
   ```bash
   railway login
   ```

3. **Điều hướng đến thư mục backend**
   ```bash
   cd backend
   ```

4. **Khởi tạo dự án Railway**
   ```bash
   railway init
   ```
   - Chọn "Create a new project"
   - Nhập tên dự án (ví dụ: "chat-backend")

5. **Thiết lập Biến Môi trường**
   ```bash
   railway variables set FRONTEND_URL=https://your-frontend.vercel.app
   railway variables set PORT=3001
   railway variables set NODE_ENV=production
   ```
   
   **Lưu ý**: Bạn sẽ cập nhật `FRONTEND_URL` sau khi deploy frontend.

6. **Triển khai**
   ```bash
   railway up
   ```

7. **Lấy Railway URL của bạn**
   - Railway sẽ cung cấp URL như: `https://your-app.up.railway.app`
   - Hoặc kiểm tra trong Railway dashboard tại "Settings" → "Domains"
   - Sao chép URL này (bạn sẽ cần nó cho frontend)

### Tùy chọn B: Sử dụng Railway Dashboard (GitHub)

1. **Push code lên GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/appchat-socket.git
   git push -u origin main
   ```

2. **Tạo Dự án Railway**
   - Truy cập [railway.app](https://railway.app)
   - Click "New Project"
   - Chọn "Deploy from GitHub repo"
   - Chọn repository của bạn

3. **Cấu hình Dự án**
   - Đặt root directory thành `backend`
   - Railway sẽ tự động phát hiện Node.js

4. **Thiết lập Biến Môi trường**
   - Vào tab "Variables"
   - Thêm:
     ```
     FRONTEND_URL=https://your-frontend.vercel.app
     PORT=3001
     NODE_ENV=production
     ```

5. **Triển khai**
   - Railway sẽ tự động triển khai
   - Chờ quá trình triển khai hoàn tất
   - Lấy Railway URL từ "Settings" → "Domains"

### Cấu hình Railway

**Cài đặt Quan trọng:**
- **Root Directory**: `backend`
- **Build Command**: (tự động phát hiện)
- **Start Command**: `npm start`
- **Port**: Railway tự động gán, sử dụng biến env `PORT`

## ⚡ Bước 2: Triển khai Frontend lên Vercel

### Tùy chọn A: Sử dụng Vercel CLI

1. **Cài đặt Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Điều hướng đến thư mục frontend**
   ```bash
   cd frontend
   ```

3. **Đăng nhập Vercel**
   ```bash
   vercel login
   ```

4. **Triển khai**
   ```bash
   vercel
   ```
   
   Làm theo hướng dẫn:
   - Link to existing project? → No (lần đầu)
   - Project name → Nhập tên (ví dụ: "chat-app")
   - Directory → `./` (thư mục hiện tại)
   - Override settings? → No

5. **Thiết lập Biến Môi trường**
   ```bash
   vercel env add NEXT_PUBLIC_SOCKET_URL
   ```
   - Nhập giá trị: Railway backend URL của bạn (ví dụ: `https://your-app.up.railway.app`)
   - Chọn môi trường: Production, Preview, Development

6. **Triển khai lại với biến môi trường**
   ```bash
   vercel --prod
   ```

### Tùy chọn B: Sử dụng Vercel Dashboard (GitHub)

1. **Push code lên GitHub** (nếu chưa làm)
   ```bash
   git add .
   git commit -m "Add frontend"
   git push
   ```

2. **Import Dự án trong Vercel**
   - Truy cập [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import GitHub repository của bạn

3. **Cấu hình Dự án**
   - **Framework Preset**: Next.js (tự động phát hiện)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (tự động phát hiện)
   - **Output Directory**: `.next` (tự động phát hiện)

4. **Thiết lập Biến Môi trường**
   - Vào "Settings" → "Environment Variables"
   - Thêm:
     ```
     Name: NEXT_PUBLIC_SOCKET_URL
     Value: https://your-backend-url.railway.app
     ```
   - Chọn tất cả môi trường (Production, Preview, Development)

5. **Triển khai**
   - Click "Deploy"
   - Chờ quá trình triển khai hoàn tất
   - Lấy Vercel URL của bạn (ví dụ: `https://your-app.vercel.app`)

## 🔄 Bước 3: Cập nhật CORS và Biến Môi trường

### Cập nhật CORS Backend (Railway)

1. **Vào Railway Dashboard**
   - Mở dự án backend của bạn
   - Vào "Variables"

2. **Cập nhật FRONTEND_URL**
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

3. **Triển khai lại** (Railway sẽ tự động triển khai lại khi thay đổi biến)

### Cập nhật Socket URL Frontend (Vercel)

1. **Vào Vercel Dashboard**
   - Mở dự án frontend của bạn
   - Vào "Settings" → "Environment Variables"

2. **Cập nhật NEXT_PUBLIC_SOCKET_URL**
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

3. **Triển khai lại**
   - Vào "Deployments"
   - Click "..." trên deployment mới nhất
   - Click "Redeploy"

## ✅ Bước 4: Xác minh Triển khai

1. **Kiểm thử Backend**
   - Truy cập: `https://your-backend.railway.app/health`
   - Nên trả về: `{"status":"ok","message":"Server is running"}`

2. **Kiểm thử Frontend**
   - Truy cập: `https://your-frontend.vercel.app`
   - Nên tải trang đăng nhập
   - Thử tham gia phòng và gửi tin nhắn

3. **Kiểm thử Kết nối Real-time**
   - Mở hai tab trình duyệt
   - Tham gia cùng một phòng với các username khác nhau
   - Gửi tin nhắn và xác minh giao hàng real-time

## 🔧 Xử lý Sự cố

### Vấn đề Backend

**Vấn đề**: Backend không kết nối
- Kiểm tra logs Railway: `railway logs`
- Xác minh biến môi trường đã được thiết lập
- Kiểm tra cổng được cấu hình đúng

**Vấn đề**: Lỗi CORS
- Xác minh `FRONTEND_URL` khớp chính xác với Vercel URL của bạn
- Bao gồm protocol (`https://`)
- Không có dấu gạch chéo ở cuối

**Vấn đề**: Kết nối Socket.io thất bại
- Kiểm tra WebSocket đã được bật trên Railway
- Xác minh URL có thể truy cập
- Kiểm tra console trình duyệt để tìm lỗi

### Vấn đề Frontend

**Vấn đề**: Không thể kết nối với backend
- Xác minh `NEXT_PUBLIC_SOCKET_URL` được thiết lập đúng
- Kiểm tra nó khớp với Railway URL
- Đảm bảo biến môi trường được thiết lập cho production

**Vấn đề**: Build thất bại
- Kiểm tra logs build Vercel
- Xác minh tất cả dependencies có trong `package.json`
- Kiểm tra lỗi TypeScript

**Vấn đề**: Biến môi trường không hoạt động
- Biến phải bắt đầu bằng `NEXT_PUBLIC_` để có thể truy cập trong trình duyệt
- Triển khai lại sau khi thêm/thay đổi biến
- Xóa cache trình duyệt

## 📊 Giám sát

### Giám sát Railway

- Xem logs: `railway logs` hoặc Railway dashboard
- Theo dõi sử dụng tài nguyên trong dashboard
- Thiết lập cảnh báo cho lỗi

### Giám sát Vercel

- Xem logs triển khai trong dashboard
- Theo dõi phân tích trong tab "Analytics"
- Kiểm tra logs function cho API routes

## 🔐 Cân nhắc Bảo mật

1. **Biến Môi trường**
   - Không bao giờ commit file `.env`
   - Sử dụng biến môi trường của platform
   - Xoay secrets thường xuyên

2. **CORS**
   - Chỉ cho phép domain frontend của bạn
   - Không sử dụng wildcard (`*`) trong production

3. **Giới hạn Tốc độ**
   - Cân nhắc thêm giới hạn tốc độ cho backend
   - Sử dụng bảo vệ tích hợp của Railway

## 💰 Ước tính Chi phí

### Giới hạn Gói Miễn phí

**Vercel:**
- 100GB băng thông/tháng
- Triển khai không giới hạn
- Hoàn hảo cho dự án này

**Railway:**
- $5 tín dụng miễn phí/tháng
- ~500 giờ runtime
- Đủ cho phát triển/dự án nhỏ

### Gói Trả phí

- Railway: $5/tháng cho gói hobby
- Vercel: Gói miễn phí rất hào phóng

## 🎉 Thành công!

Ứng dụng chat của bạn giờ đã live! Chia sẻ Vercel URL với người khác để kiểm thử.

## 📝 Tài nguyên Bổ sung

- [Tài liệu Vercel](https://vercel.com/docs)
- [Tài liệu Railway](https://docs.railway.app)
- [Hướng dẫn Triển khai Socket.io](https://socket.io/docs/v4/deployment/)
