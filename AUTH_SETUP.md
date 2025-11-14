# 🔐 Hướng dẫn Cấu hình Authentication

## Tổng quan

Hệ thống authentication bao gồm:
- ✅ Đăng ký với email/password
- ✅ Đăng nhập với email/password  
- ✅ Đăng nhập với Google OAuth

## Cấu hình Backend

### 1. Tạo file `.env` trong thư mục `backend/`

Sao chép từ `.env.example` và điền thông tin:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# JWT Secret - Thay đổi trong production!
JWT_SECRET=your-secret-key-change-in-production

# Session Secret - Thay đổi trong production!
SESSION_SECRET=your-session-secret-change-in-production

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 2. Cấu hình Google OAuth

#### Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Điền thông tin:
   - **Name**: ChatApp (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3001/api/auth/google/callback`
7. Click **Create**
8. Copy **Client ID** và **Client Secret** vào file `.env`

#### Bước 2: Enable Google+ API

1. Vào **APIs & Services** > **Library**
2. Tìm "Google+ API" hoặc "Google Identity"
3. Click **Enable**

### 3. Cài đặt Dependencies

Dependencies đã được cài đặt tự động, bao gồm:
- `bcrypt` - Hash passwords
- `jsonwebtoken` - JWT tokens
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `express-session` - Session management

## Cấu hình Frontend

### 1. Tạo file `.env.local` trong thư mục `frontend/` (nếu chưa có)

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Sử dụng

### Đăng ký

1. Mở ứng dụng tại `http://localhost:3000`
2. Click tab **Đăng ký**
3. Điền thông tin:
   - Tên người dùng
   - Email
   - Mật khẩu (tối thiểu 6 ký tự)
   - Xác nhận mật khẩu
4. Click **Đăng ký**

### Đăng nhập

1. Click tab **Đăng nhập**
2. Nhập email và mật khẩu
3. Click **Đăng nhập**

### Đăng nhập với Google

1. Click nút **Đăng nhập với Google**
2. Chọn tài khoản Google
3. Cho phép ứng dụng truy cập thông tin
4. Tự động chuyển về ứng dụng

## Flow Authentication

```
1. User đăng nhập/đăng ký
   ↓
2. Backend tạo JWT token
   ↓
3. Frontend lưu token vào localStorage
   ↓
4. User chọn phòng chat
   ↓
5. Socket.io kết nối với token
   ↓
6. Bắt đầu chat!
```

## API Endpoints

### POST `/api/auth/register`
Đăng ký tài khoản mới

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/auth/login`
Đăng nhập

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET `/api/auth/google`
Bắt đầu Google OAuth flow

### GET `/api/auth/google/callback`
Google OAuth callback (tự động redirect)

### GET `/api/auth/me`
Lấy thông tin user hiện tại (cần token)

**Headers:**
```
Authorization: Bearer <token>
```

## Lưu ý

⚠️ **Production:**
- Thay đổi `JWT_SECRET` và `SESSION_SECRET` thành giá trị ngẫu nhiên mạnh
- Cập nhật `FRONTEND_URL` và `GOOGLE_CALLBACK_URL` với domain thực
- Sử dụng HTTPS
- Cấu hình CORS đúng cách

🔒 **Security:**
- Passwords được hash bằng bcrypt (10 rounds)
- JWT tokens có thời hạn 7 ngày
- Tokens được lưu trong localStorage (có thể nâng cấp lên httpOnly cookies)

## Troubleshooting

### Google OAuth không hoạt động

1. Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env`
2. Đảm bảo redirect URI khớp với cấu hình trong Google Console
3. Kiểm tra Google+ API đã được enable

### Lỗi "Token không hợp lệ"

1. Kiểm tra token trong localStorage
2. Đảm bảo `JWT_SECRET` giống nhau giữa các lần restart server
3. Token có thể đã hết hạn (7 ngày)

### Lỗi kết nối Socket.io

1. Kiểm tra backend đang chạy
2. Kiểm tra `NEXT_PUBLIC_SOCKET_URL` trong frontend
3. Kiểm tra CORS configuration

