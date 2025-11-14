'use client'

import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
}

interface MessageListProps {
  messages: Message[]
  currentUsername: string
  typingUsers: string[]
}

export default function MessageList({ messages, currentUsername, typingUsers }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll khi có tin nhắn mới hoặc typing users thay đổi
  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-280px)]"
      style={{ minHeight: '400px' }}
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg">Chưa có tin nhắn nào</p>
            <p className="text-gray-400 text-sm mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.username === currentUsername
          const isSystemMessage = message.username === 'System'

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              isSystemMessage={isSystemMessage}
            />
          )
        })
      )}

      {/* Typing Indicator - luôn hiển thị khi có người đang gõ */}
      {typingUsers.length > 0 && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} đang gõ`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} và ${typingUsers[1]} đang gõ`
                  : `${typingUsers[0]} và ${typingUsers.length - 1} người khác đang gõ`}
              </span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anchor để scroll xuống */}
      <div ref={messagesEndRef} />
    </div>
  )
}

