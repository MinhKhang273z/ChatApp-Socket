    'use client'

import { useState, useEffect } from 'react'

interface RoomSelectorProps {
  username: string
  onCreateRoom: (room: string) => void
  onJoinRoom: (room: string) => void
  onLeaveRoom?: (room: string) => void
  existingRooms?: string[]
}

interface Room {
  name: string
  createdBy: string
  createdAt: string
  memberCount: number
}

export default function RoomSelector({ username, onCreateRoom, onJoinRoom, onLeaveRoom, existingRooms = [] }: RoomSelectorProps) {
  const [newRoomName, setNewRoomName] = useState('')
  const [joinRoomName, setJoinRoomName] = useState('')
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)

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

  // Fetch danh sách tất cả phòng khi component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true)
        const getBackendUrl = () => {
          if (typeof window === 'undefined') return 'http://localhost:3001'
          const hostname = window.location.hostname
          if (hostname.startsWith('26.')) return `http://${hostname}:3001`
          return 'http://localhost:3001'
        }
        const backendUrl = getBackendUrl()
        const response = await fetch(`${backendUrl}/api/rooms`)
        if (response.ok) {
          const data = await response.json()
          setAllRooms(data.rooms || [])
        }
      } catch (err) {
        console.error('Error fetching rooms:', err)
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchRooms()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header with welcome message */}
        <div className="text-center mb-8 text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-full mb-4 border border-white/30">
            <span className="text-5xl">💬</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Chào mừng, {username}!</h1>
          <p className="text-lg text-white/80">Tạo hoặc tham gia phòng chat để bắt đầu trò chuyện</p>
        </div>

        {/* Create Room Section */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span> Tạo phòng chat mới
          </h2>
          
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label htmlFor="newRoom" className="block text-sm font-semibold text-gray-700 mb-2">
                Tên phòng
              </label>
              <input
                id="newRoom"
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Ví dụ: Nhóm học tập, Bạn bè..."
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-black placeholder:text-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
            >
              Tạo phòng
            </button>
          </form>
        </div>

        {/* Join Room Section */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚪</span> Tham gia phòng có sẵn
          </h2>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="joinRoom" className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
            >
              Tham gia phòng
            </button>
          </form>
        </div>

        {/* All Available Rooms Section */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌐</span> Tất cả các phòng đã tạo
          </h2>
          {loadingRooms ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Đang tải danh sách phòng...</p>
            </div>
          ) : allRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {allRooms.map((room) => {
                const isUserInRoom = existingRooms.includes(room.name)
                return (
                  <div
                    key={room.name}
                    className={`p-4 rounded-lg border transition ${
                      isUserInRoom
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">#{room.name}</p>
                          {isUserInRoom && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                              Đã tham gia
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Tạo bởi: <span className="font-medium">{room.createdBy}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          👥 {room.memberCount} thành viên
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {isUserInRoom ? (
                          <>
                            <button
                              onClick={() => onJoinRoom(room.name)}
                              className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition font-medium whitespace-nowrap"
                              title="Vào phòng"
                            >
                              Vào
                            </button>
                            {onLeaveRoom && (
                              <button
                                onClick={() => onLeaveRoom(room.name)}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition font-medium whitespace-nowrap"
                                title="Rời phòng"
                              >
                                Rời
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onJoinRoom(room.name)}
                            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition font-medium whitespace-nowrap"
                          >
                            Tham gia
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Chưa có phòng nào được tạo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

