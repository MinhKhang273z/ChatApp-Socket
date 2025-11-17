'use client'

interface FileInfo {
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
}

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
  file?: FileInfo
  isRecalled?: boolean
  recalledAt?: Date
  recalledBy?: string
}

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
  isSystemMessage: boolean
  onRecallMessage: (messageId: string) => void
  isDarkMode?: boolean
}

export default function ChatMessage({ message, isOwnMessage, isSystemMessage, onRecallMessage, isDarkMode = false }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isImage = (mimetype: string) => {
    return mimetype.startsWith('image/')
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️'
    if (mimetype === 'application/pdf') return '📄'
    if (mimetype.includes('word')) return '📝'
    return '📎'
  }

  const canRecall = () => {
    if (!isOwnMessage || isSystemMessage || message.isRecalled) return false
    
    // Cho phép thu hồi bất cứ lúc nào
    return true
  }

  const handleRecall = () => {
    if (window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
      // Sử dụng _id nếu id không tồn tại
      const messageId = message.id || (message as any)._id
      console.log('Message object:', message)
      console.log('Using messageId:', messageId)
      onRecallMessage(messageId)
    }
  }

  // Nếu tin nhắn đã bị thu hồi
  if (message.isRecalled) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
        }`}>
          <div className="text-sm italic flex items-center gap-2">
            <span>🔄</span>
            <span>Tin nhắn đã được thu hồi</span>
          </div>
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatTime(message.recalledAt || message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <div className="flex items-end gap-2">
        {/* Nút thu hồi (chỉ hiện khi hover và có thể thu hồi) */}
        {canRecall() && (
          <button
            onClick={handleRecall}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
              isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="Thu hồi tin nhắn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        )}

        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isSystemMessage
              ? isDarkMode
                ? 'bg-gray-700 text-gray-300 text-center mx-auto'
                : 'bg-gray-100 text-gray-600 text-center mx-auto'
              : isOwnMessage
              ? 'bg-blue-600 text-white'
              : isDarkMode
              ? 'bg-gray-700 text-gray-100'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {!isSystemMessage && (
            <div className={`text-xs mb-1 font-semibold ${
              isOwnMessage
                ? 'text-blue-100'
                : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}>
              {message.username}
            </div>
          )}
          
          {/* Hiển thị file nếu có */}
          {message.file && (
            <div className="mb-2">
              {isImage(message.file.mimetype) ? (
                <a 
                  href={`http://localhost:3001${message.file.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={`http://localhost:3001${message.file.url}`}
                    alt={message.file.originalName}
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                    style={{ maxHeight: '300px' }}
                  />
                </a>
              ) : (
                <a
                  href={`http://localhost:3001${message.file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded ${
                    isOwnMessage
                      ? 'bg-blue-700 hover:bg-blue-800'
                      : isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-500'
                      : 'bg-gray-300 hover:bg-gray-400'
                  } transition`}
                >
                  <span className="text-2xl">{getFileIcon(message.file.mimetype)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.file.originalName}</p>
                    <p className="text-xs opacity-75">{(message.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </a>
              )}
            </div>
          )}
          
          {message.text && (
            <div className="text-sm break-words whitespace-pre-wrap">{message.text}</div>
          )}
          
          <div className={`text-xs mt-1 ${
            isOwnMessage
              ? 'text-blue-100'
              : isDarkMode
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}

