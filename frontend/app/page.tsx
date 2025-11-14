'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import ChatRoom from '@/components/ChatRoom'
import LoginForm from '@/components/LoginForm'

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
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState<string>('')
  const [room, setRoom] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
      setTypingUsers((prev) => new Set([...prev, data.username]))
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
  }, [])

  const handleLogin = (username: string, room: string) => {
    if (!socket) return

    setUsername(username)
    setRoom(room)
    socket.emit('user:join', { username, room })
  }

  const handleSendMessage = (text: string) => {
    if (!socket || !text.trim()) return
    socket.emit('message:send', { text })
  }

  const handleTyping = (isTyping: boolean) => {
    if (!socket) return
    if (isTyping) {
      socket.emit('typing:start')
    } else {
      socket.emit('typing:stop')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    )
  }

  if (!username || !room) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <ChatRoom
      username={username}
      room={room}
      messages={messages}
      users={users}
      typingUsers={Array.from(typingUsers)}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
      isConnected={isConnected}
    />
  )
}

