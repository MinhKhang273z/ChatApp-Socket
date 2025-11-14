'use client'

import { useState } from 'react'

interface RoomSelectorProps {
  username: string
  onJoinRoom: (room: string) => void
}

export default function RoomSelector({ username, onJoinRoom }: RoomSelectorProps) {
  const [room, setRoom] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (room.trim()) {
      onJoinRoom(room.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Chào mừng, {username}!
          </h1>
          <p className="text-gray-600 text-sm">
            Chọn hoặc tạo phòng chat để bắt đầu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
              Tên phòng
            </label>
            <input
              id="room"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Nhập tên phòng..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-black placeholder:text-gray-400"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-lg"
          >
            Tham gia phòng
          </button>
        </form>
      </div>
    </div>
  )
}

