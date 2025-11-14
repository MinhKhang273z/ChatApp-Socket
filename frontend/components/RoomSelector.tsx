'use client'

import { useState, useEffect } from 'react'

interface RoomSelectorProps {
  username: string
  onCreateRoom: (room: string) => void
  onJoinRoom: (room: string) => void
  onLeaveRoom?: (room: string) => void
  existingRooms?: string[]
}

export default function RoomSelector({ username, onCreateRoom, onJoinRoom, onLeaveRoom, existingRooms = [] }: RoomSelectorProps) {
  const [newRoomName, setNewRoomName] = useState('')
  const [joinRoomName, setJoinRoomName] = useState('')
  const [availableRooms, setAvailableRooms] = useState<string[]>([])

  useEffect(() => {
    // Fetch available rooms from API
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/rooms')
        const data = await response.json()
        const roomNames = data.rooms.map((r: { name: string }) => r.name)
        setAvailableRooms(roomNames)
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }
    fetchRooms()
  }, [])

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim())
      setNewRoomName('') // Clear input after creating
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinRoomName.trim()) {
      onJoinRoom(joinRoomName.trim())
      setJoinRoomName('') // Clear input after joining
    }
  }

  const handleJoinExistingRoom = (roomName: string) => {
    onJoinRoom(roomName)
  }

  // Filter out rooms user is already in
  const roomsToShow = availableRooms.filter(r => !existingRooms.includes(r))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x-0 md:divide-x divide-gray-200">
          {/* Left Section: Create New Room */}
          <div className="p-8">
            <div className="text-center mb-6">
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

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tạo phòng chat mới</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label htmlFor="newRoom" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên phòng
                </label>
                <input
                  id="newRoom"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Nhập tên phòng..."
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-black placeholder:text-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-lg"
              >
                Tạo phòng
              </button>
            </form>
          </div>

          {/* Right Section: Join Existing Room */}
          <div className="p-8">
            <div className="text-center mb-6">
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

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tham gia phòng chat có sẵn</h2>
            
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="joinRoom" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã phòng / Tên phòng
                </label>
                <input
                  id="joinRoom"
                  type="text"
                  value={joinRoomName}
                  onChange={(e) => setJoinRoomName(e.target.value)}
                  placeholder="Nhập mã hoặc tên phòng..."
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-black placeholder:text-gray-400"
                  required
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

        {/* Existing Rooms Section - Show below on mobile, or as a separate section */}
        {(existingRooms.length > 0 || roomsToShow.length > 0) && (
          <div className="border-t p-8">
            {existingRooms.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Phòng của bạn</h2>
                <div className="flex flex-wrap gap-2">
                  {existingRooms.map((roomName) => (
                    <div key={roomName} className="flex items-center gap-2">
                      <button
                        onClick={() => handleJoinExistingRoom(roomName)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium"
                      >
                        💬 {roomName}
                      </button>
                      {onLeaveRoom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onLeaveRoom(roomName)
                          }}
                          className="px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                          title="Rời phòng"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roomsToShow.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Phòng có sẵn</h2>
                <div className="flex flex-wrap gap-2">
                  {roomsToShow.map((roomName) => (
                    <button
                      key={roomName}
                      onClick={() => handleJoinExistingRoom(roomName)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
                    >
                      📢 {roomName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

