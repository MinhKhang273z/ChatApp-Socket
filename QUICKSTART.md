# ⚡ Hướng dẫn Bắt đầu Nhanh

Chạy ứng dụng chat trong 5 phút!

## 🚀 Thiết lập Nhanh

### 1. Cài đặt Dependencies

```bash
npm run install:all
```

### 2. Cấu hình Môi trường

**Backend** - Tạo `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** - Tạo `frontend/.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Khởi động Cả hai Server

```bash
npm run dev
```

Điều này sẽ khởi động:
- Backend trên http://localhost:3001
- Frontend trên http://localhost:3000

### 4. Mở Trình duyệt

Truy cập http://localhost:3000 và bắt đầu chat!

## 🧪 Kiểm thử

1. Mở http://localhost:3000 trong trình duyệt của bạn
2. Nhập username và tên phòng
3. Mở tab/cửa sổ khác
4. Tham gia cùng một phòng với username khác
5. Gửi tin nhắn và xem chúng xuất hiện real-time!

## 📝 Lưu ý

- Đảm bảo cả hai server đang chạy
- Backend phải khởi động trước khi frontend kết nối
- Sử dụng username khác nhau trong các tab khác nhau để kiểm thử chat đa người dùng

## 🐛 Xử lý Sự cố

**Cổng đã được sử dụng?**
- Thay đổi `PORT` trong `backend/.env`
- Cập nhật `NEXT_PUBLIC_SOCKET_URL` trong `frontend/.env.local`

**Lỗi kết nối?**
- Kiểm tra backend đang chạy: http://localhost:3001/health
- Xác minh biến môi trường được thiết lập đúng
- Kiểm tra console trình duyệt để tìm lỗi

## 📚 Bước Tiếp theo

- Đọc [README.md](./README.md) để xem tài liệu đầy đủ
- Kiểm tra [DEPLOYMENT.md](./DEPLOYMENT.md) để xem hướng dẫn triển khai
