'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import ChatRoom from '@/components/ChatRoom'
import AuthForm from '@/components/AuthForm'
import RoomSelector from '@/components/RoomSelector'

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
}

interface User {
  id: string
  username: string
  room: string
}

export default function Home() {
  const searchParams = useSearchParams()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [room, setRoom] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Check authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    const error = searchParams.get('error')

    if (error) {
      alert(`Lỗi: ${decodeURIComponent(error)}`)
    }

    if (storedToken && storedUsername) {
      setToken(storedToken)
      setUsername(storedUsername)
      setIsAuthenticated(true)
    }
  }, [searchParams])

  useEffect(() => {
    // Only initialize socket if authenticated
    if (!isAuthenticated) return

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error)
      alert(error.message)
    })

    newSocket.on('message:receive', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    newSocket.on('user:joined', (data: { username: string; message: string; timestamp: Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          username: 'System',
          text: data.message,
          timestamp: new Date(data.timestamp),
        },
      ])
    })

    newSocket.on('user:left', (data: { username: string; message: string; timestamp: Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          username: 'System',
          text: data.message,
          timestamp: new Date(data.timestamp),
        },
      ])
    })

    newSocket.on('room:info', (data: { room: string; users: string[]; messages: Message[] }) => {
      setUsers(data.users)
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })))
      }
    })

    newSocket.on('typing:start', (data: { username: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.add(data.username)
        return newSet
      })
    })

    newSocket.on('typing:stop', (data: { username: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(data.username)
        return newSet
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [isAuthenticated, token])

  // Handle authentication success
  const handleAuthSuccess = useCallback((username: string, token: string) => {
    setUsername(username)
    setToken(token)
    setIsAuthenticated(true)
  }, [])

  // Handle room join
  const handleJoinRoom = useCallback((roomName: string) => {
    if (!socket) return
    setRoom(roomName)
    socket.emit('user:join', { username, room: roomName })
  }, [socket, username])

  const handleSendMessage = useCallback((text: string) => {
    if (!socket || !text.trim()) return
    socket.emit('message:send', { text })
  }, [socket])

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket) return
    if (isTyping) {
      socket.emit('typing:start')
    } else {
      socket.emit('typing:stop')
    }
  }, [socket])

  // Chuyển đổi Set thành Array với useMemo
  const typingUsersArray = useMemo(() => {
    const arr: string[] = []
    typingUsers.forEach(user => arr.push(user))
    return arr
  }, [typingUsers])

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  // Show loading if socket not connected yet
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Đang kết nối đến server...</p>
        </div>
      </div>
    )
  }

  // Show room selector if no room selected
  if (!room) {
    return <RoomSelector username={username} onJoinRoom={handleJoinRoom} />
  }

  // Show chat room
  return (
    <ChatRoom
      username={username}
      room={room}
      messages={messages}
      users={users}
      typingUsers={typingUsersArray}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
      isConnected={isConnected}
    />
  )
}

