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
}

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
  isSystemMessage: boolean
  isDarkMode?: boolean
}

export default function ChatMessage({ message, isOwnMessage, isSystemMessage, isDarkMode = false }: ChatMessageProps) {
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

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
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
  )
}

