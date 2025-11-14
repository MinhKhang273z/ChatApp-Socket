# 🏗️ Tổng quan Kiến trúc

## Kiến trúc Hệ thống

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  Next.js Client │         (Socket.io)        │  Express Server │
│   (Frontend)    │                            │    (Backend)    │
│                 │                            │                 │
│  Port: 3000     │                            │  Port: 3001     │
└─────────────────┘                            └─────────────────┘
       │                                               │
       │                                               │
       ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   React UI       │                            │  Socket.io      │
│   Components    │                            │  Event Handler  │
│                 │                            │                 │
│  - LoginForm    │                            │  - user:join    │
│  - ChatRoom     │                            │  - message:send │
│  - MessageList  │                            │  - typing       │
│  - MessageInput │                            │  - disconnect   │
│  - UserList     │                            │                 │
└─────────────────┘                            └─────────────────┘
```

## Công nghệ Sử dụng

### Frontend
- **Next.js 14** - Framework React với App Router
- **React 18** - Thư viện UI
- **TypeScript** - An toàn kiểu
- **Tailwind CSS** - Styling
- **Socket.io Client** - Giao tiếp real-time

### Backend
- **Node.js** - Môi trường runtime
- **Express** - Web framework
- **Socket.io** - Thư viện WebSocket
- **CORS** - Chia sẻ tài nguyên cross-origin

## Luồng Dữ liệu

### 1. Người dùng Tham gia Phòng
```
Client → socket.emit('user:join', {username, room})
Server → Lưu người dùng vào Map
Server → socket.join(room)
Server → Emit 'room:info' đến client
Server → Emit 'user:joined' đến các client khác
```

### 2. Gửi Tin nhắn
```
Client → socket.emit('message:send', {text})
Server → Xác thực người dùng tồn tại
Server → Tạo đối tượng tin nhắn
Server → Lưu vào tin nhắn phòng
Server → io.to(room).emit('message:receive', message)
Tất cả Clients → Nhận và hiển thị tin nhắn
```

### 3. Chỉ báo Đang gõ
```
Client → socket.emit('typing:start')
Server → socket.to(room).emit('typing:start', {username})
Các Client khác → Hiển thị chỉ báo đang gõ
Client → socket.emit('typing:stop')
Server → socket.to(room).emit('typing:stop', {username})
Các Client khác → Ẩn chỉ báo đang gõ
```

### 4. Người dùng Ngắt kết nối
```
Client → Ngắt kết nối (đóng trình duyệt, vấn đề mạng)
Server → socket.on('disconnect')
Server → Xóa người dùng khỏi Map
Server → Xóa khỏi phòng
Server → socket.to(room).emit('user:left', {username})
Các Client khác → Hiển thị thông báo rời
```

## Quản lý Trạng thái

### Trạng thái Backend
- **users Map** - Người dùng đang hoạt động theo socket.id
  ```js
  Map<socketId, {id, username, room, joinedAt}>
  ```

- **rooms Map** - Dữ liệu phòng và tin nhắn
  ```js
  Map<roomName, [messages...]>
  ```

### Trạng thái Frontend
- **Kết nối Socket** - Instance client Socket.io
- **Mảng Messages** - Tin nhắn chat
- **Mảng Users** - Người dùng online trong phòng
- **Người dùng đang gõ** - Set người dùng hiện đang gõ
- **Trạng thái kết nối** - Đã kết nối/đã ngắt kết nối

## Socket.io Events

### Client → Server Events
| Event | Payload | Mô tả |
|-------|---------|-------|
| `user:join` | `{username, room}` | Tham gia phòng chat |
| `message:send` | `{text}` | Gửi tin nhắn |
| `typing:start` | - | Bắt đầu chỉ báo đang gõ |
| `typing:stop` | - | Dừng chỉ báo đang gõ |

### Server → Client Events
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

## Cấu trúc Component

```
App (page.tsx)
├── LoginForm (nếu chưa đăng nhập)
│   └── Form inputs (username, room)
│
└── ChatRoom (nếu đã đăng nhập)
    ├── Header
    │   ├── Tên phòng
    │   └── Trạng thái kết nối
    │
    ├── MessageList
    │   ├── Các mục tin nhắn
    │   └── Chỉ báo đang gõ
    │
    ├── MessageInput
    │   ├── Trường input
    │   └── Nút gửi
    │
    └── UserList
        └── Người dùng online
```

## Cân nhắc Bảo mật

### Triển khai Hiện tại
- Bảo vệ CORS cơ bản
- Xác thực input trên server
- Không có xác thực (tất cả người dùng đều ẩn danh)

### Khuyến nghị Production
- Thêm xác thực người dùng (JWT, OAuth)
- Giới hạn tốc độ cho tin nhắn
- Làm sạch input
- Mã hóa tin nhắn
- Tính năng kiểm duyệt người dùng
- Bảo vệ spam

## Khả năng Mở rộng

### Giới hạn Hiện tại
- Lưu trữ trong bộ nhớ (tin nhắn mất khi khởi động lại)
- Một instance server
- Không lưu trữ tin nhắn

### Tùy chọn Mở rộng
- **Database**: MongoDB/PostgreSQL để lưu trữ tin nhắn
- **Redis**: Để quản lý phiên và pub/sub
- **Load Balancer**: Nhiều instance server
- **Message Queue**: Cho tin nhắn khối lượng lớn
- **CDN**: Cho tài sản tĩnh

## Tối ưu Hiệu suất

### Frontend
- React memo cho component tin nhắn
- Virtual scrolling cho danh sách tin nhắn dài
- Chỉ báo đang gõ debounced
- Lazy loading components

### Backend
- Giới hạn tin nhắn mỗi phòng (100 tin nhắn)
- Cấu trúc dữ liệu Map hiệu quả
- Dữ liệu tối thiểu trong socket events
- Connection pooling


## Cải tiến Tương lai

1. **Tích hợp Database**
   - Lưu trữ tin nhắn
   - Hồ sơ người dùng
   - Lịch sử chat

2. **Xác thực**
   - Tài khoản người dùng
   - Phòng riêng tư
   - Điều khiển admin

3. **Tính năng**
   - Chia sẻ file
   - Phản ứng emoji
   - Tìm kiếm tin nhắn
   - Xác nhận đã đọc

4. **Hạ tầng**
   - Redis để mở rộng
   - Nhiều instance server
   - Cân bằng tải
