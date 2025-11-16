'use client'

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
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
        <div className="text-sm break-words whitespace-pre-wrap">{message.text}</div>
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

