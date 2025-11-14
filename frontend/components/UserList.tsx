'use client'

interface UserListProps {
  users: string[]
  currentUsername: string
}

export default function UserList({ users, currentUsername }: UserListProps) {
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
              className={`flex items-center space-x-2 p-2 rounded-lg ${
                user === currentUsername
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium">
                {user}
                {user === currentUsername && ' (You)'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

