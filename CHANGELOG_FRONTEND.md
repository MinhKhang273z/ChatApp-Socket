# Frontend Changelog - ChatApp Socket

## Ngày: 2025-11-14

### 🎯 Mục Tiêu
Cải thiện frontend với quản lý state tốt hơn, tách component, typing indicator liên tục, và khung chat cố định với scroll.

---

## ✨ Các Thay Đổi Chính

### 1. **Component Mới: ChatMessage** ⭐
**File**: `frontend/components/ChatMessage.tsx`

- Tách logic hiển thị từng tin nhắn thành component riêng
- Dễ bảo trì và tái sử dụng
- Hỗ trợ 3 loại message: own message, other's message, system message
- Format thời gian theo locale Việt Nam

**Props**:
```typescript
interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
  isSystemMessage: boolean
}
```

---

### 2. **Cải Thiện MessageList Component** 🔄
**File**: `frontend/components/MessageList.tsx`

#### Thay đổi:
- ✅ Sử dụng component `ChatMessage` thay vì inline JSX
- ✅ Cố định chiều cao: `max-h-[calc(100vh-280px)]` với `minHeight: 400px`
- ✅ Overflow-y-auto để cuộn khi tin nhắn nhiều
- ✅ Auto scroll khi có tin nhắn mới HOẶC typing users thay đổi
- ✅ Typing indicator với animation fade-in
- ✅ Hiển thị thông minh cho nhiều người đang gõ:
  - 1 người: "User đang gõ"
  - 2 người: "User1 và User2 đang gõ"
  - 3+ người: "User1 và 2 người khác đang gõ"

#### useEffect Dependencies:
```typescript
useEffect(() => {
  scrollToBottom()
}, [messages, typingUsers]) // Scroll khi messages HOẶC typingUsers thay đổi
```

---

### 3. **Cải Thiện MessageInput Component** 📝
**File**: `frontend/components/MessageInput.tsx`

#### Tính năng mới:
- ✅ **Validation nâng cao**:
  - Giới hạn 1000 ký tự
  - Trim whitespace tự động
  - Thông báo lỗi rõ ràng
  
- ✅ **Character counter**:
  - Hiển thị khi > 80% giới hạn
  - Đổi màu đỏ khi < 50 ký tự còn lại

- ✅ **Typing indicator thông minh**:
  - Timeout: 2 giây (tăng từ 1s)
  - Dừng ngay khi input rỗng
  - Dừng khi gửi tin nhắn

- ✅ **UX improvements**:
  - Enter để gửi tin nhắn
  - Auto focus sau khi gửi
  - Disable nút Send khi input rỗng
  - Placeholder tiếng Việt

#### Constants:
```typescript
const MAX_MESSAGE_LENGTH = 1000
const TYPING_TIMEOUT = 2000 // 2 giây
```

---

### 4. **Tối Ưu State Management** ⚡
**File**: `frontend/app/page.tsx`

#### Thay đổi:
- ✅ Import `useCallback` và `useMemo`
- ✅ Wrap event handlers với `useCallback`:
  - `handleLogin`
  - `handleSendMessage`
  - `handleTyping`
  
- ✅ Sử dụng `useMemo` cho `typingUsersArray`:
  ```typescript
  const typingUsersArray = useMemo(() => Array.from(typingUsers), [typingUsers])
  ```

#### Lợi ích:
- Tránh re-render không cần thiết
- Tối ưu performance
- Giảm computation

---

### 5. **CSS & Animations** 🎨
**File**: `frontend/app/globals.css`

#### Thêm mới:
```css
/* Fade in animation for typing indicator */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

/* Smooth scroll behavior */
.smooth-scroll {
  scroll-behavior: smooth;
}
```

---

## 📊 Tổng Kết Thay Đổi

### Files Created (1):
- ✅ `frontend/components/ChatMessage.tsx`

### Files Modified (4):
- ✅ `frontend/components/MessageList.tsx`
- ✅ `frontend/components/MessageInput.tsx`
- ✅ `frontend/app/page.tsx`
- ✅ `frontend/app/globals.css`

### Files Unchanged:
- `frontend/components/ChatRoom.tsx` (không cần thay đổi)
- `frontend/components/UserList.tsx` (không cần thay đổi)
- `frontend/components/LoginForm.tsx` (không cần thay đổi)

---

## 🧪 Testing

### Checklist:
- [ ] Gửi tin nhắn thành công
- [ ] Typing indicator hiển thị khi gõ
- [ ] Typing indicator tự động ẩn sau 2s không gõ
- [ ] Scroll tự động khi có tin nhắn mới
- [ ] Scroll tự động khi có typing indicator
- [ ] Validation: không gửi được tin nhắn rỗng
- [ ] Validation: không gửi được tin nhắn > 1000 ký tự
- [ ] Enter để gửi tin nhắn
- [ ] Hiển thị số ký tự còn lại
- [ ] Multiple users typing cùng lúc
- [ ] Khung chat cố định, cuộn được khi nhiều tin nhắn

---

## 🚀 Cách Chạy

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (terminal khác)
cd backend
npm install
npm start
```

Truy cập: http://localhost:3000

---

## 📝 Notes

- Backend không cần thay đổi (typing events đã hoạt động tốt)
- Tất cả validation ở client-side (có thể thêm server-side validation sau)
- Typing timeout tăng lên 2s để UX tốt hơn
- Component architecture sẵn sàng cho các tính năng mở rộng

---

## 🔜 Next Steps (Đề xuất)

1. Thêm unit tests cho components
2. Thêm E2E tests với Playwright/Cypress
3. Implement message reactions
4. Implement reply to message
5. Add file upload functionality

