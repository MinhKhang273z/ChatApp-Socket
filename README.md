# 💬 ChatApp-Socket

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb)

**Ứng dụng chat real-time full-stack với bảo mật hiện đại, chia sẻ đa phương tiện và cuộc gọi WebRTC.**

[Tổng quan](#-tổng-quan) • [Tính năng](#-tính-năng-nổi-bật) • [Kiến trúc](#-kiến-trúc--công-nghệ) • [Bắt đầu nhanh](#-bắt-đầu-nhanh) • [API](#-api-rest) • [Socket Events](#-socketio-events) • [Kiểm thử](#-kiểm-thử--qa)

</div>

---

## 📖 Tổng quan

**ChatApp-Socket** kết hợp Next.js 14 (App Router) & Tailwind ở frontend với Node.js + Express + Socket.io + MongoDB ở backend. Toàn bộ luồng giao tiếp (auth → join phòng → nhắn tin → chia sẻ file/voice → gọi WebRTC) đã được hiện thực hóa trong codebase.

### ✨ Điểm nhấn
- ⚡ Real-time latency thấp với Socket.io + cơ chế tự reconnect.
- 🔐 Auth đầy đủ: Email/password + Google OAuth, JWT 7 ngày, session Passport.
- 💬 Tin nhắn lưu MongoDB, hỗ trợ recall, reply, mention, reaction, tìm kiếm cục bộ.
- 📎 Media hub: upload ảnh/file (10 MB), preview trực tiếp, voice message thu âm trong browser.
- 📞 WebRTC: gọi thoại & video 1-1, trạng thái cuộc gọi realtime, mute/camera toggle.
- 🌓 Dark mode, bộ lọc từ khóa, danh sách phòng online, lưu state cục bộ an toàn theo user.

---

## 🚀 Tính năng nổi bật

| Nhóm | Chi tiết đã triển khai |
|------|------------------------|
| **Messaging** | Socket.io messaging, lịch sử MongoDB (50 tin gần nhất/room), thu hồi bất kỳ lúc nào, reply có @tag, highlight mention, reaction emoji (thả 😍🔥💯…), search nội bộ, System log join/leave. |
| **Rooms & Users** | Tạo/xóa phòng, lưu membership vào MongoDB, danh sách phòng cá nhân, thống kê user online, health check, phân quyền chủ phòng. |
| **Multimedia** | Upload ảnh/file qua `multer`, preview image/PDF/Word, giới hạn 10 MB + validate MIME, voice message bằng MediaRecorder với waveform player. |
| **Calls** | WebRTC 1-1 voice/video, signaling qua Socket.io (`call:*` events), Call modal giàu tính năng (mute, toggle camera, kết thúc). |
| **Productivity** | Dark/light mode, panel cài đặt, search message, typing indicator, sidebar rooms, lưu state per-user trong localStorage (kèm kiểm tra chủ sở hữu). |
| **Bảo mật** | Bcrypt 10 rounds, JWT 7 ngày, verify token middleware, CORS whitelist, express-session cho OAuth, upload path tách biệt, log lỗi chuẩn hóa. |

---

## 🔐 Authentication & Authorization
- **Đăng ký/đăng nhập local**: kiểm tra trùng username/email, hash password, trả JWT + thông tin user.
- **Google OAuth 2.0**: Passport strategy `passport-google-oauth20`, session-based flow, liên kết tài khoản nếu email trùng.
- **JWT Guard**: middleware `verifyToken` bảo vệ `/api/auth/me`, socket handshake truyền token trong `auth`.
- **User profile**: endpoint `/api/auth/me` trả `id/username/email/avatar`.
- **MongoDB persistence**: models `User`, `Room`, `Message` lưu provider, avatar, room membership, file metadata, reply, mentions, reactions.

👉 Chi tiết cấu hình xem thêm `AUTH_SETUP.md`.

---

## 🎧 Chia sẻ nội dung & cuộc gọi
- **Upload pipeline**: `POST /api/messages/upload` (multer) lưu file vào `backend/uploads`, auto trả metadata để phát broadcast qua Socket.
- **Voice message**: ghi âm trong `MessageInput`, convert sang WebM, gửi như file audio, phát với waveform trong `ChatMessage`.
- **Thu hồi tin nhắn**: sự kiện `message:recall` xoá file khỏi disk nếu có, cập nhật `isRecalled`, broadcast tới mọi user.
- **Reaction & Mention**: backend lưu `message.reactions` & `mentions`, frontend render badge + tooltips.
- **WebRTC calls**: events `call:offer`, `call:answer`, `call:answer-sdp`, `call:ice-candidate`, `call:end`, modal hỗ trợ mute/camera toggle, reject/accept.

---

## 🏗️ Kiến trúc & Công nghệ

| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Socket.io Client | Auth UI, room selector, chat workspace, call modal, local state + storage. |
| Backend | Node.js, Express, Socket.io, MongoDB (Mongoose), Multer, Passport, express-session | REST API, realtime hub, upload file, WebRTC signaling, auth, health endpoints. |
| Storage | MongoDB + disk `backend/uploads` | Persist user, room, message (kèm file/reply/mentions/reactions). |
| Realtime | `handlers/socketHandlers.js` | Room lifecycle, message send/recall/reaction, typing indicator, WebRTC signaling, in-memory users map. |

### Cấu trúc thư mục
```
ChatApp-Socket/
├── backend/
│   ├── server.js                # Khởi tạo Express + Socket.io + MongoDB
│   ├── controllers/             # user / room / message logic
│   ├── handlers/socketHandlers.js
│   ├── routes/                  # /api/auth, /api/rooms, /api/messages
│   ├── models/                  # User, Room, Message schemas
│   ├── config/                  # passport, multer
│   └── middleware/              # auth guard, error handler
├── frontend/
│   ├── app/                     # Next.js pages (auth, chat)
│   ├── components/              # ChatRoom, MessageInput, CallModal...
│   └── styles/configs           # Tailwind, tsconfig, next config
└── package.json                 # Scripts chạy cả front/back
```

---

## ⚡ Bắt đầu nhanh

### Yêu cầu
- Node.js ≥ 18 & npm ≥ 9
- MongoDB (local/Docker/Atlas)
- Google Cloud project (nếu dùng OAuth)

### Cài đặt
```bash
git clone https://github.com/yourusername/ChatApp-Socket.git
cd ChatApp-Socket
npm run install:all
```

### Biến môi trường
`backend/.env`
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=change-me
SESSION_SECRET=change-me-too
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

`frontend/.env.local`
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Chạy Development
```bash
npm run dev          # chạy backend + frontend cùng lúc
# hoặc
npm run dev:backend
npm run dev:frontend
```

### Production
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm start
```

### URL mặc định
- Frontend: http://localhost:3000
- Backend API / Socket: http://localhost:3001
- Health check: GET http://localhost:3001/health

---

## 📚 API REST

### Auth (`/api/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/register` | Đăng ký user mới `{ username, email, password }` |
| `POST` | `/login` | Đăng nhập local `{ email, password }` |
| `GET`  | `/google` | Redirect Google OAuth |
| `GET`  | `/google/callback` | Xử lý callback, tạo JWT, redirect frontend |
| `GET`  | `/me` *(Bearer token)* | Lấy thông tin user hiện tại |

### Rooms (`/api/rooms`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/` | Danh sách phòng (name, createdBy, memberCount, createdAt) |

### Messages (`/api/messages`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/upload` | Upload file/voice qua `multipart/form-data` (fields: `file`, `username`, `room`, optional `text`, `replyTo`, `mentions`) |

### Misc
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/api/users` | Danh sách user đang online (từ socket map) |
| `GET`  | `/health` | Kiểm tra trạng thái server |

---

## 📡 Socket.io Events

### Client → Server
| Event | Payload | Ghi chú |
|-------|---------|---------|
| `room:create` | `{ username, room }` | Tạo phòng, lưu Mongo |
| `room:delete` | `{ username, room }` | Chủ phòng xoá phòng |
| `user:join` | `{ username, room }` | Tham gia phòng |
| `user:leave` | `{ room }` | Rời phòng |
| `user:getRooms` | - | Lấy phòng user đang tham gia |
| `user:getRoomInfo` | `{ room }` | Lấy users + messages |
| `message:send` | `{ text, room, file?, replyTo?, mentions? }` | Gửi tin nhắn |
| `message:recall` | `{ messageId, room }` | Thu hồi tin |
| `message:reaction` | `{ messageId, emoji, room }` | Thêm/bỏ reaction |
| `typing:start` / `typing:stop` | `{ room }` | Chỉ báo đang gõ |
| `call:offer` / `call:answer` / `call:answer-sdp` / `call:ice-candidate` / `call:end` | WebRTC signaling |

### Server → Client
| Event | Payload | Ghi chú |
|-------|---------|---------|
| `room:created` | `{ room, message, timestamp }` | Kết quả tạo phòng |
| `room:info` | `{ room, users, messages, createdBy }` | Snapshot phòng |
| `room:deleted` | `{ room, message }` | Phòng bị xoá, buộc leave |
| `user:rooms` | `{ rooms }` | Danh sách phòng user |
| `user:joined` / `user:left` | `{ username, message, timestamp, room }` | Log hệ thống |
| `message:receive` | `Message` | Tin nhắn mới (text/file/voice) |
| `message:recalled` | `{ messageId, recalledBy, recalledAt }` | Tin bị thu hồi |
| `message:reaction` | `{ messageId, reactions }` | Danh sách reaction cập nhật |
| `typing:start` / `typing:stop` | `{ username, room }` | Hiển thị người đang gõ |
| `call:incoming` / `call:answer` / `call:answer-sdp` / `call:ice-candidate` / `call:rejected` / `call:ended` | Trạng thái cuộc gọi |

---

## 💡 UX nổi bật
- Room selector hiển thị danh sách tham gia + nút leave nhanh.
- Header chat: trạng thái kết nối, dark/light toggle, search box.
- MessageInput: dropdown gợi ý @mention, upload icon, voice recorder với timer & waveform, counter ký tự.
- Message bubble: reply preview, image/file/audio preview, reaction picker, recall button.
- User list: online indicator, nút gọi voice/video ngay từ popup.

---

## 🧪 Kiểm thử & QA
| Script | Mục đích |
|--------|---------|
| `node test-auth.js` | Smoke test đăng ký & đăng nhập API |
| `node test-frontend-backend.js` | Kiểm tra health + login endpoint từ frontend |
| Manual | Mở ≥2 tab, gửi text/file/voice, recall, reaction, initiate voice/video call |

Khuyến nghị khởi chạy MongoDB nhanh bằng Docker:
```powershell
docker run -d --name chatapp-mongo -p 27017:27017 -v chatapp-mongo-data:/data/db mongo:latest
```

---

## 🐛 Troubleshooting
- **Không kết nối Socket**: xác minh `FRONTEND_URL` khớp origin thực tế, token JWT không hết hạn, firewall mở port 3001.
- **OAuth lỗi**: kiểm tra `GOOGLE_CLIENT_ID/SECRET`, redirect URI đúng, bật Google Identity API.
- **Upload thất bại**: tệp >10 MB hoặc MIME không nằm trong whitelist, thư mục `backend/uploads` cần quyền ghi.
- **WebRTC không call được**: trình duyệt cần HTTPS khi deploy, nếu cả hai client nằm sau NAT → cấu hình TURN server riêng, xem console để tra ICE logs.

---

## 🔮 Roadmap
- [ ] Private chat / DM
- [ ] Full-text search & pin tin nhắn
- [ ] Spam & content moderation
- [ ] Ghi hình cuộc gọi & lưu cloud
- [ ] Slash command / bot
- [ ] Multi-device session sync nâng cao

---

<div align="center">

**Được tạo với ❤️ bởi nhóm 22 phát triển ChatApp-Socket**  
Nếu dự án giúp ích cho bạn, đừng quên ⭐ trên GitHub!

</div>

