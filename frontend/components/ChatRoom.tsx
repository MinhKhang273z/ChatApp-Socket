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
  onSendMessage: (text: string, file?: File, mentions?: string[]) => void
  onTyping: (isTyping: boolean) => void
  onRecallMessage: (messageId: string) => void
  onReplyMessage: (message: Message) => void
  onReaction: (messageId: string, emoji: string) => void
  replyingTo: Message | null
  onCancelReply: () => void
  onLeaveRoom: () => void
  onDeleteRoom?: () => void
  onAddRoom: () => void
  onLogout: () => void
  isConnected: boolean
  onStartCall?: (targetUser: string, callType: 'voice' | 'video') => void
  userRooms: string[]
  onSelectRoom: (room: string) => void
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
  onRecallMessage,
  onReplyMessage,
  onReaction,
  replyingTo,
  onCancelReply,
  onLeaveRoom,
  onDeleteRoom,
  onAddRoom,
  onLogout,
  isConnected,
  onStartCall,
  userRooms,
  onSelectRoom,
}: ChatRoomProps) {
  const isRoomOwner = roomCreatedBy === username

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load theme from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('chatTheme') : null
    if (saved === 'dark') setIsDarkMode(true)
  }, [])

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('chatTheme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Filter messages based on search term
  const filteredMessages = searchTerm
    ? messages.filter((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages

  // Dynamic classes based on theme
  const containerClass = isDarkMode
    ? 'min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-50 flex flex-col'
    : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col'

  const panelClass = isDarkMode ? 'bg-gray-900 text-gray-50' : 'bg-white'
  const headerClass = isDarkMode ? 'bg-gray-900 text-gray-50' : 'bg-white'
  const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={containerClass}>
      {/* Header */}
      <header className={`${headerClass} shadow-md px-6 py-4`}>
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
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-50' : 'text-gray-800'} flex items-center gap-2`}>
                💬 {room}
              </h1>
              <p className={`text-sm ${textClass}`}>
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
            <p className={`text-sm ${textClass}`}>You are: <span className="font-semibold text-blue-600">{username}</span></p>
            <p className={`text-xs ${textClass}`}>{users.length} user{users.length !== 1 ? 's' : ''} online</p>
          </div>
          <div className="flex gap-2 items-center relative">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
              title="Cài đặt"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Settings Popup */}
            {showSettings && (
              <div className={`absolute right-0 top-12 w-72 rounded-lg shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 z-20 ${panelClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Chế độ giao diện</span>
                  <button
                    onClick={() => setIsDarkMode((prev) => !prev)}
                    className="px-3 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    {isDarkMode ? '🌙 Tối' : '☀️ Sáng'}
                  </button>
                </div>

                <div className="mt-3">
                  <label className={`text-xs ${textClass} block mb-1`}>Tìm kiếm tin nhắn</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập nội dung cần tìm..."
                    className={`w-full px-3 py-2 rounded-md border text-sm ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-black placeholder-gray-400'
                    }`}
                  />
                  {searchTerm && (
                    <p className={`text-xs ${textClass} mt-1`}>
                      Tìm thấy {filteredMessages.length} tin nhắn
                    </p>
                  )}
                </div>
              </div>
            )}

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
        {/* Rooms Sidebar (Left) */}
        <div className={`w-64 rounded-lg shadow-lg p-4 flex flex-col ${panelClass}`}>
          <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-50' : 'text-gray-800'}`}>
            Đoạn chat của bạn
          </h2>
          {userRooms.length === 0 ? (
            <p className={`text-sm ${textClass}`}>Bạn chưa tham gia phòng nào</p>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {userRooms.map((roomName) => (
                <button
                  key={roomName}
                  onClick={() => onSelectRoom(roomName)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${
                    roomName === room
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">#</span>
                    <span className="truncate">{roomName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Section (Center) */}
        <div className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden ${panelClass}`}>
          <MessageList
            messages={filteredMessages}
            currentUsername={username}
            typingUsers={typingUsers.filter(u => u !== username)}
            onRecallMessage={onRecallMessage}
            onReplyMessage={onReplyMessage}
            onReaction={onReaction}
            isDarkMode={isDarkMode}
          />
          <MessageInput
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            users={users}
            replyingTo={replyingTo}
            onCancelReply={onCancelReply}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Users Sidebar (Right) */}
        <div className={`w-64 rounded-lg shadow-lg p-4 ${panelClass}`}>
          <UserList users={users} currentUsername={username} onStartCall={onStartCall} isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  )
}