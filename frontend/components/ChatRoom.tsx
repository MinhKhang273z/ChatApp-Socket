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
  roomCreatedBy?: string
  onSendMessage: (text: string) => void
  onTyping: (isTyping: boolean) => void
  onLeaveRoom: () => void
  onDeleteRoom?: () => void
  onAddRoom: () => void
  onLogout: () => void
  isConnected: boolean
  onStartCall?: (targetUser: string, callType: 'voice' | 'video') => void
}

export default function ChatRoom({
  username,
  room,
  messages,
  users,
  typingUsers,
  roomCreatedBy,
  onSendMessage,
  onTyping,
  onLeaveRoom,
  onDeleteRoom,
  onAddRoom,
  onLogout,
  isConnected,
  onStartCall,
}: ChatRoomProps) {
  const isRoomOwner = roomCreatedBy === username
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onAddRoom}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                💬 {room}
              </h1>
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
          </div>
          <div className="text-right mr-4">
            <p className="text-sm text-gray-600">You are: <span className="font-semibold text-blue-600">{username}</span></p>
            <p className="text-xs text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} online</p>
          </div>
          <div className="flex gap-2">
            {isRoomOwner && onDeleteRoom && (
              <button
                onClick={onDeleteRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium shadow-md"
              >
                Xóa Phòng
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium shadow-md"
            >
              Đăng xuất
            </button>
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
          <UserList users={users} currentUsername={username} onStartCall={onStartCall} />
        </div>
      </div>
    </div>
  )
}