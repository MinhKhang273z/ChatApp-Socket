'use client'

import { useState, useEffect, useRef } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import UserList from './UserList'

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
}

interface ChatRoomProps {
  username: string
  room: string
  messages: Message[]
  users: string[]
  typingUsers: string[]
  onSendMessage: (text: string) => void
  onTyping: (isTyping: boolean) => void
  isConnected: boolean
}

export default function ChatRoom({
  username,
  room,
  messages,
  users,
  typingUsers,
  onSendMessage,
  onTyping,
  isConnected,
}: ChatRoomProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💬 {room}</h1>
            <p className="text-sm text-gray-600">
              {isConnected ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">You are: <span className="font-semibold text-blue-600">{username}</span></p>
            <p className="text-xs text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} online</p>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-6 gap-4">
        {/* Messages Section */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
          <MessageList 
            messages={messages} 
            currentUsername={username}
            typingUsers={typingUsers.filter(u => u !== username)}
          />
          <MessageInput 
            onSendMessage={onSendMessage}
            onTyping={onTyping}
          />
        </div>

        {/* Users Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow-lg p-4">
          <UserList users={users} currentUsername={username} />
        </div>
      </div>
    </div>
  )
}