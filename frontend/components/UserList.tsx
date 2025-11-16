'use client'

import { useState } from 'react'

interface UserListProps {
  users: string[]
  currentUsername: string
  onStartCall?: (targetUser: string, callType: 'voice' | 'video') => void
}

export default function UserList({ users, currentUsername, onStartCall }: UserListProps) {
  const [showCallMenu, setShowCallMenu] = useState<string | null>(null)

  const handleCallClick = (user: string, callType: 'voice' | 'video') => {
    if (onStartCall) {
      onStartCall(user, callType)
    }
    setShowCallMenu(null)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Online Users</h2>
      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users online</p>
        ) : (
          users.map((user) => (
            <div
              key={user}
              className={`flex items-center justify-between p-2 rounded-lg ${
                user === currentUsername
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium">
                  {user}
                  {user === currentUsername && ' (You)'}
                </span>
              </div>

              {/* Call buttons for other users */}
              {user !== currentUsername && onStartCall && (
                <div className="relative">
                  <button
                    onClick={() => setShowCallMenu(showCallMenu === user ? null : user)}
                    className="p-1 hover:bg-gray-200 rounded transition"
                    title="Gọi"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>

                  {/* Call menu */}
                  {showCallMenu === user && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-36">
                      <button
                        onClick={() => handleCallClick(user, 'voice')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Voice Call
                      </button>
                      <button
                        onClick={() => handleCallClick(user, 'video')}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left text-sm border-t"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video Call
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

