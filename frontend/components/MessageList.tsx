'use client'

import { useEffect, useRef } from 'react'

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.username === currentUsername
          const isSystemMessage = message.username === 'System'

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isSystemMessage
                    ? 'bg-gray-100 text-gray-600 text-center mx-auto'
                    : isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {!isSystemMessage && (
                  <div className={`text-xs mb-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                    {message.username}
                  </div>
                )}
                <div className="text-sm break-words">{message.text}</div>
                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          )
        })
      )}

      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-1">
              <span className="text-sm">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing`
                  : `${typingUsers.join(', ')} are typing`}
              </span>
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

