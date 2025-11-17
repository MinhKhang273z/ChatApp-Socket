'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import ChatRoom from '@/components/ChatRoom'
import AuthForm from '@/components/AuthForm'
import RoomSelector from '@/components/RoomSelector'
import CallModal from '@/components/CallModal'

interface FileInfo {
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
}

interface ReplyInfo {
  messageId: string
  username: string
  text: string
  file?: {
    filename: string
    originalName: string
    mimetype: string
  }
}

interface Reaction {
  emoji: string
  username: string
  timestamp: Date
}

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
  file?: FileInfo
  isRecalled?: boolean
  recalledAt?: Date
  recalledBy?: string
  replyTo?: ReplyInfo
  reactions?: Reaction[]
  mentions?: string[]
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
  const [currentRoom, setCurrentRoom] = useState<string>('')
  const [userRooms, setUserRooms] = useState<string[]>([])
  const [roomCreatedBy, setRoomCreatedBy] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const currentRoomRef = useRef<string>('')

  // WebRTC State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [callType, setCallType] = useState<'voice' | 'video'>('voice')
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [callerName, setCallerName] = useState<string>('')
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const [targetCallUser, setTargetCallUser] = useState<string>('')
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)

  // Update ref when currentRoom changes
  useEffect(() => {
    currentRoomRef.current = currentRoom
  }, [currentRoom])

  // Check authentication on mount and restore room state
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    const storedCurrentRoom = localStorage.getItem('currentRoom')
    const storedCurrentRoomUser = localStorage.getItem('currentRoomUser') // Username who owns currentRoom
    const storedUserRooms = localStorage.getItem('userRooms')
    const storedUserRoomsUser = localStorage.getItem('userRoomsUser') // Username who owns userRooms
    const lastView = localStorage.getItem('lastView') // 'roomSelector' or 'chatRoom'
    const lastViewUser = localStorage.getItem('lastViewUser') // Username who owns lastView
    const error = searchParams.get('error')

    if (error) {
      alert(`Lỗi: ${decodeURIComponent(error)}`)
    }

    if (storedToken && storedUsername) {
      setToken(storedToken)
      setUsername(storedUsername)
      setIsAuthenticated(true)
      
      // Only restore data if it belongs to the current user
      const isCurrentUserData = storedUsername === storedUserRoomsUser
      
      if (isCurrentUserData && storedUserRooms) {
        try {
          const rooms = JSON.parse(storedUserRooms)
          // Only set userRooms if there are actually rooms
          if (rooms && rooms.length > 0) {
            setUserRooms(rooms)
          } else {
            // No rooms, clear everything
            setUserRooms([])
            localStorage.removeItem('userRooms')
            localStorage.removeItem('userRoomsUser')
          }
        } catch (e) {
          console.error('Error parsing stored rooms:', e)
          setUserRooms([])
          localStorage.removeItem('userRooms')
          localStorage.removeItem('userRoomsUser')
        }
      } else {
        // Clear old data from different user
        setUserRooms([])
        localStorage.removeItem('userRooms')
        localStorage.removeItem('userRoomsUser')
      }
      
      // Only restore currentRoom if:
      // 1. It belongs to current user
      // 2. Last view was chatRoom
      // 3. User has rooms (userRooms is not empty)
      const isCurrentUserRoom = storedUsername === storedCurrentRoomUser
      const isCurrentUserLastView = storedUsername === lastViewUser
      const hasUserRooms = isCurrentUserData && storedUserRooms && (() => {
        try {
          const rooms = JSON.parse(storedUserRooms)
          return rooms && rooms.length > 0
        } catch {
          return false
        }
      })()
      
      if (isCurrentUserRoom && isCurrentUserLastView && storedCurrentRoom && 
          lastView === 'chatRoom' && hasUserRooms) {
        // Double check that the room is in userRooms
        try {
          const rooms = JSON.parse(storedUserRooms)
          if (rooms && rooms.includes(storedCurrentRoom)) {
            setCurrentRoom(storedCurrentRoom)
          } else {
            // Room not in userRooms, clear it
            setCurrentRoom('')
            localStorage.removeItem('currentRoom')
            localStorage.removeItem('currentRoomUser')
            localStorage.setItem('lastView', 'roomSelector')
            localStorage.setItem('lastViewUser', storedUsername)
          }
        } catch {
          setCurrentRoom('')
          localStorage.removeItem('currentRoom')
          localStorage.removeItem('currentRoomUser')
          localStorage.setItem('lastView', 'roomSelector')
          localStorage.setItem('lastViewUser', storedUsername)
        }
      } else {
        // Clear old data from different user or no rooms
        setCurrentRoom('')
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', storedUsername)
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Only initialize socket if authenticated
    if (!isAuthenticated) return

    // Initialize socket connection
    // Tự động detect backend URL dựa vào hostname hiện tại
    const getSocketUrl = () => {
      if (typeof window === 'undefined') return 'http://localhost:3001'
      const hostname = window.location.hostname
      // Nếu truy cập qua Radmin VPN IP
      if (hostname.startsWith('26.')) return `http://${hostname}:3001`
      // Mặc định localhost
      return 'http://localhost:3001'
    }
    const socketUrl = getSocketUrl()
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
      
      // Restore rooms from localStorage and rejoin them (only if they belong to current user)
      const storedUserRooms = localStorage.getItem('userRooms')
      const storedUserRoomsUser = localStorage.getItem('userRoomsUser')
      const storedCurrentRoom = localStorage.getItem('currentRoom')
      const storedCurrentRoomUser = localStorage.getItem('currentRoomUser')
      const lastView = localStorage.getItem('lastView')
      const lastViewUser = localStorage.getItem('lastViewUser')
      
      // Only restore if data belongs to current user AND user has rooms
      if (storedUserRooms && storedUserRoomsUser === username) {
        try {
          const rooms = JSON.parse(storedUserRooms)
          // Only proceed if user actually has rooms
          if (rooms && Array.isArray(rooms) && rooms.length > 0) {
            // Rejoin all rooms (with error handling)
            rooms.forEach((roomName: string) => {
              newSocket.emit('user:join', { username, room: roomName })
            })
            
            // Set up error handler for rejoin failures
            const rejoinErrorHandler = (error: { message: string }) => {
              const errorMessage = error.message.toLowerCase()
              if (errorMessage.includes('không tồn tại')) {
                // Room doesn't exist, remove it from userRooms
                const roomMatch = error.message.match(/phòng\s+"([^"]+)"/i) || 
                                 error.message.match(/phòng\s+([^\s]+)/i)
                if (roomMatch && roomMatch[1]) {
                  const roomToRemove = roomMatch[1]
                  setUserRooms((prev) => {
                    const updated = prev.filter(r => r !== roomToRemove)
                    localStorage.setItem('userRooms', JSON.stringify(updated))
                    localStorage.setItem('userRoomsUser', username)
                    return updated
                  })
                }
              }
            }
            
            // Temporarily add error handler for rejoin
            newSocket.once('error', rejoinErrorHandler)
            // Only restore current room if:
            // 1. It belongs to current user
            // 2. Last view was chatRoom
            // 3. Room exists in user's rooms list
            if (storedCurrentRoom && storedCurrentRoomUser === username && 
                lastView === 'chatRoom' && lastViewUser === username && 
                rooms.includes(storedCurrentRoom)) {
              // Small delay to ensure rooms are joined first
              setTimeout(() => {
                setCurrentRoom(storedCurrentRoom)
              }, 100)
            } else {
              // Don't restore currentRoom if conditions not met
              setCurrentRoom('')
            }
          } else {
            // User has no rooms, clear everything
            setCurrentRoom('')
            setUserRooms([])
            localStorage.removeItem('userRooms')
            localStorage.removeItem('userRoomsUser')
            localStorage.removeItem('currentRoom')
            localStorage.removeItem('currentRoomUser')
            localStorage.setItem('lastView', 'roomSelector')
            localStorage.setItem('lastViewUser', username)
          }
        } catch (e) {
          console.error('Error parsing stored rooms:', e)
          // Clear on error
          setCurrentRoom('')
          setUserRooms([])
          localStorage.removeItem('userRooms')
          localStorage.removeItem('userRoomsUser')
          localStorage.removeItem('currentRoom')
          localStorage.removeItem('currentRoomUser')
          localStorage.setItem('lastView', 'roomSelector')
          localStorage.setItem('lastViewUser', username)
        }
      } else {
        // Data doesn't belong to current user, clear everything
        setCurrentRoom('')
        setUserRooms([])
        localStorage.removeItem('userRooms')
        localStorage.removeItem('userRoomsUser')
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', username)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error)
      
      // Check if error is about room not existing or already in room
      const errorMessage = error.message.toLowerCase()
      const isRoomNotExist = errorMessage.includes('không tồn tại')
      const isAlreadyInRoom = errorMessage.includes('đã ở trong phòng')
      
      if (isRoomNotExist && currentRoomRef.current) {
        // Room doesn't exist, remove it from userRooms and clear currentRoom
        const roomToRemove = currentRoomRef.current
        setUserRooms((prev) => {
          const updated = prev.filter(r => r !== roomToRemove)
          localStorage.setItem('userRooms', JSON.stringify(updated))
          localStorage.setItem('userRoomsUser', username)
          return updated
        })
        setCurrentRoom('')
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', username)
        alert(error.message)
      } else if (isAlreadyInRoom) {
        // User already in room, just switch to it (don't show error)
        // The handleJoinRoom should handle this, but if we get here, just switch
        const roomMatch = error.message.match(/phòng\s+([^\s]+)/i)
        if (roomMatch && roomMatch[1]) {
          const roomName = roomMatch[1]
          setCurrentRoom(roomName)
          localStorage.setItem('currentRoom', roomName)
          localStorage.setItem('currentRoomUser', username)
          localStorage.setItem('lastView', 'chatRoom')
          localStorage.setItem('lastViewUser', username)
          // Request room info
          newSocket.emit('user:getRoomInfo', { room: roomName })
        }
      } else {
        // Other errors
        alert(error.message)
        if (currentRoomRef.current) {
          setCurrentRoom('')
          localStorage.setItem('lastView', 'roomSelector')
          localStorage.setItem('lastViewUser', username)
        }
      }
    })

    newSocket.on('message:receive', (message: Message & { room?: string }) => {
      // Only show messages for current room
      if (!message.room || message.room === currentRoomRef.current) {
        const processedMessage = {
          ...message,
          id: message.id || (message as any)._id, // Đảm bảo có id
          timestamp: new Date(message.timestamp)
        }
        console.log('Received new message:', processedMessage)
        setMessages((prev) => [...prev, processedMessage])
      }
    })

    newSocket.on('user:joined', (data: { username: string; message: string; timestamp: Date; room?: string }) => {
      // Only show join messages for current room
      if (!data.room || data.room === currentRoomRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            username: 'System',
            text: data.message,
            timestamp: new Date(data.timestamp),
          },
        ])
      }
    })

    newSocket.on('user:left', (data: { username: string; message: string; timestamp: Date; room?: string }) => {
      // Only show leave messages for current room
      if (!data.room || data.room === currentRoomRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            username: 'System',
            text: data.message,
            timestamp: new Date(data.timestamp),
          },
        ])
      }
    })

    newSocket.on('room:created', (data: { room: string; message: string; timestamp: Date }) => {
      // Show success notification
      alert(data.message)
      // Room info will be sent via room:info event
    })

    newSocket.on('room:info', (data: { room: string; users: string[]; messages: Message[]; createdBy?: string }) => {
      // Only update if this is the current room
      if (data.room === currentRoomRef.current) {
        setUsers(data.users)
        if (data.createdBy) {
          setRoomCreatedBy(data.createdBy)
        }
        if (data.messages && data.messages.length > 0) {
          const processedMessages = data.messages.map((msg) => ({
            ...msg,
            id: msg.id || (msg as any)._id, // Đảm bảo có id
            timestamp: new Date(msg.timestamp),
          }))
          console.log('Loaded messages:', processedMessages)
          setMessages(processedMessages)
        } else {
          setMessages([])
        }
      }
    })

    newSocket.on('room:deleted', (data: { room: string; message: string; timestamp: Date }) => {
      // If the deleted room is the current room, go back to room selector
      if (data.room === currentRoomRef.current) {
        alert(data.message)
        setCurrentRoom('')
        setRoomCreatedBy('')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', username)
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
        setMessages([])
        setUsers([])
      }
    })

    newSocket.on('user:rooms', (data: { rooms: string[] }) => {
      setUserRooms(data.rooms)
      // Save to localStorage with username
      localStorage.setItem('userRooms', JSON.stringify(data.rooms))
      localStorage.setItem('userRoomsUser', username)
      
      // If current room is not in the list anymore, clear it
      if (currentRoomRef.current && !data.rooms.includes(currentRoomRef.current)) {
        setCurrentRoom('')
        setRoomCreatedBy('')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', username)
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
      }
    })

    newSocket.on('room:left', (data: { room: string; remainingRooms: string[] }) => {
      setUserRooms(data.remainingRooms)
      // Save to localStorage with username
      localStorage.setItem('userRooms', JSON.stringify(data.remainingRooms))
      localStorage.setItem('userRoomsUser', username)
      
      // If we left the current room, switch to room selector
      if (data.room === currentRoomRef.current) {
        setCurrentRoom('')
        setRoomCreatedBy('')
        localStorage.setItem('lastView', 'roomSelector')
        localStorage.setItem('lastViewUser', username)
        localStorage.removeItem('currentRoom')
        localStorage.removeItem('currentRoomUser')
        setMessages([])
        setUsers([])
      }
    })

    newSocket.on('typing:start', (data: { username: string; room?: string }) => {
      // Only show typing for current room
      if (!data.room || data.room === currentRoomRef.current) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.add(data.username)
          return newSet
        })
      }
    })

    newSocket.on('typing:stop', (data: { username: string; room?: string }) => {
      // Only show typing for current room
      if (!data.room || data.room === currentRoomRef.current) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.username)
          return newSet
        })
      }
    })

    newSocket.on('message:recalled', (data: { messageId: string; recalledBy: string; recalledAt: Date }) => {
      console.log('🔄 Message recalled event received:', data)
      setMessages((prev) => {
        const updated = prev.map(msg => {
          const msgId = msg.id || (msg as any)._id
          console.log('Checking message:', msgId, 'vs', data.messageId)
          return (msgId === data.messageId || (msg as any)._id === data.messageId)
            ? { ...msg, isRecalled: true, recalledAt: new Date(data.recalledAt), recalledBy: data.recalledBy }
            : msg
        })
        console.log('Updated messages:', updated)
        return updated
      })
    })

    newSocket.on('message:reaction', (data: { messageId: string; reactions: Reaction[] }) => {
      setMessages((prev) => prev.map(msg => {
        const msgId = msg.id || (msg as any)._id
        return (msgId === data.messageId || (msg as any)._id === data.messageId)
          ? { ...msg, reactions: data.reactions }
          : msg
      }))
    })

    // WebRTC Socket Events
    newSocket.on('call:incoming', async (data: { from: string; offer: RTCSessionDescriptionInit; callType: 'voice' | 'video' }) => {
      console.log('📞 Incoming call from:', data.from, 'Type:', data.callType)
      setTargetCallUser(data.from)
      setCallerName(data.from)
      setCallType(data.callType)
      setIsIncomingCall(true)
      setIsCallModalOpen(true)
      setCallStatus('calling')
      setIncomingOffer(data.offer)
      
      // Create peer connection immediately to receive ICE candidates
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      })
      
      pc.onicecandidate = (event) => {
        if (event.candidate && newSocket) {
          console.log('🧊 Sending ICE candidate to:', data.from)
          newSocket.emit('call:ice-candidate', {
            to: data.from,
            candidate: event.candidate,
          })
        }
      }
      
      pc.ontrack = (event) => {
        console.log('📺 Received remote track:', event.track.kind)
        setRemoteStream(event.streams[0])
      }
      
      pc.oniceconnectionstatechange = () => {
        console.log('🔌 ICE connection state:', pc.iceConnectionState)
      }
      
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setCallStatus('connected')
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Handle disconnect
        }
      }
      
      // Set remote description immediately
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
        console.log('✅ Remote description set for incoming call')
      } catch (error) {
        console.error('❌ Error setting remote description:', error)
      }
      
      peerConnectionRef.current = pc
    })

    newSocket.on('call:answer-sdp', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('📡 Received SDP answer from:', data.from)
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
          console.log('✅ Remote description set successfully')
        } else {
          console.error('❌ No peer connection when receiving answer')
        }
      } catch (error) {
        console.error('Error setting remote description:', error)
      }
    })

    newSocket.on('call:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log('🧊 Received ICE candidate from:', data.from)
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
          console.log('✅ ICE candidate added')
        } else {
          console.error('❌ No peer connection when receiving ICE candidate')
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    })

    newSocket.on('call:answer', (data: { accepted: boolean }) => {
      console.log('📞 Call answered:', data.accepted)
      if (data.accepted) {
        setCallStatus('connected')
      }
    })

    newSocket.on('call:rejected', () => {
      alert('Cuộc gọi bị từ chối')
      handleEndCall()
    })

    newSocket.on('call:ended', () => {
      handleEndCall()
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
    // Clear any old data from previous user
    localStorage.removeItem('currentRoom')
    localStorage.removeItem('currentRoomUser')
    localStorage.removeItem('userRooms')
    localStorage.removeItem('userRoomsUser')
    localStorage.setItem('lastView', 'roomSelector')
    localStorage.setItem('lastViewUser', username)
  }, [])

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('currentRoom')
    localStorage.removeItem('currentRoomUser')
    localStorage.removeItem('userRooms')
    localStorage.removeItem('userRoomsUser')
    localStorage.removeItem('lastView')
    localStorage.removeItem('lastViewUser')
    setUsername('')
    setToken('')
    setIsAuthenticated(false)
    setCurrentRoom('')
    setUserRooms([])
    setMessages([])
    setUsers([])
    if (socket) {
      socket.close()
      setSocket(null)
    }
  }, [socket])

  // Handle create room
  const handleCreateRoom = useCallback((roomName: string) => {
    if (!socket) return
    setCurrentRoom(roomName)
    setRoomCreatedBy('') // Will be set when room:info is received
    localStorage.setItem('currentRoom', roomName)
    localStorage.setItem('currentRoomUser', username)
    localStorage.setItem('lastView', 'chatRoom')
    localStorage.setItem('lastViewUser', username)
    setMessages([]) // Clear messages when switching rooms
    setUsers([]) // Clear users when switching rooms
    socket.emit('room:create', { username, room: roomName })
  }, [socket, username])

  // Handle room join (only join existing rooms)
  const handleJoinRoom = useCallback((roomName: string) => {
    if (!socket) return
    
    // Check if user is already in this room
    if (userRooms.includes(roomName)) {
      // User already in room, just switch to it
      setCurrentRoom(roomName)
      setRoomCreatedBy('') // Will be set when room:info is received
      localStorage.setItem('currentRoom', roomName)
      localStorage.setItem('currentRoomUser', username)
      localStorage.setItem('lastView', 'chatRoom')
      localStorage.setItem('lastViewUser', username)
      setMessages([]) // Clear messages when switching rooms
      setUsers([]) // Clear users when switching rooms
      // Request room info for the room we're already in
      socket.emit('user:getRoomInfo', { room: roomName })
      return
    }
    
    // User not in room yet, join it
    setCurrentRoom(roomName)
    setRoomCreatedBy('') // Will be set when room:info is received
    localStorage.setItem('currentRoom', roomName)
    localStorage.setItem('currentRoomUser', username)
    localStorage.setItem('lastView', 'chatRoom')
    localStorage.setItem('lastViewUser', username)
    setMessages([]) // Clear messages when switching rooms
    setUsers([]) // Clear users when switching rooms
    socket.emit('user:join', { username, room: roomName })
  }, [socket, username, userRooms])

  // Handle room leave (from current room)
  const handleLeaveRoom = useCallback(() => {
    if (!socket || !currentRoom) return
    socket.emit('user:leave', { room: currentRoom })
    // The room:left event will handle clearing the current room
  }, [socket, currentRoom])

  // Handle room delete (only room owner can delete)
  const handleDeleteRoom = useCallback(() => {
    if (!socket || !currentRoom) return
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${currentRoom}"? Tất cả thành viên sẽ bị đưa ra khỏi phòng.`)) {
      socket.emit('room:delete', { username, room: currentRoom })
    }
  }, [socket, currentRoom, username])

  // Handle room leave (from room selector)
  const handleLeaveRoomFromSelector = useCallback((roomName: string) => {
    if (!socket) return
    socket.emit('user:leave', { room: roomName })
    // The room:left event will handle updating userRooms
  }, [socket])

  // Handle add room (go back to room selector)
  const handleAddRoom = useCallback(() => {
    setCurrentRoom('')
    setRoomCreatedBy('')
    localStorage.setItem('lastView', 'roomSelector')
    localStorage.setItem('lastViewUser', username)
    // Don't remove currentRoom from localStorage, keep it so user can come back
    // Keep messages and users for when they come back
  }, [username])

  const handleSendMessage = useCallback(async (text: string, file?: File, mentions?: string[]) => {
    if (!socket || (!text.trim() && !file) || !currentRoom) return
    
    // Prepare reply data
    const replyData = replyingTo ? {
      messageId: replyingTo.id || (replyingTo as any)._id,
      username: replyingTo.username,
      text: replyingTo.text,
      file: replyingTo.file ? {
        filename: replyingTo.file.filename,
        originalName: replyingTo.file.originalName,
        mimetype: replyingTo.file.mimetype
      } : undefined
    } : undefined
    
    // Nếu có file, upload qua HTTP API
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('username', username)
        formData.append('room', currentRoom)
        if (text.trim()) {
          formData.append('text', text.trim())
        }
        if (replyData) {
          formData.append('replyTo', JSON.stringify(replyData))
        }
        if (mentions && mentions.length > 0) {
          formData.append('mentions', JSON.stringify(mentions))
        }

        const response = await fetch('http://localhost:3001/api/messages/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        
        // Emit qua socket để broadcast cho mọi người
        socket.emit('message:send', {
          text: data.message.text,
          room: currentRoom,
          file: data.message.file,
          replyTo: data.message.replyTo,
          mentions: data.message.mentions
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        alert('Không thể gửi file')
      }
    } else {
      // Chỉ có text, gửi bình thường
      socket.emit('message:send', { 
        text, 
        room: currentRoom,
        replyTo: replyData,
        mentions: mentions
      })
    }
    
    // Clear reply state
    setReplyingTo(null)
  }, [socket, currentRoom, username, replyingTo])

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket || !currentRoom) return
    if (isTyping) {
      socket.emit('typing:start', { room: currentRoom })
    } else {
      socket.emit('typing:stop', { room: currentRoom })
    }
  }, [socket, currentRoom])

  const handleRecallMessage = useCallback((messageId: string) => {
    if (!socket || !currentRoom) return
    console.log('🔄 Sending recall request for message:', messageId, 'in room:', currentRoom)
    socket.emit('message:recall', { messageId, room: currentRoom })
  }, [socket, currentRoom])

  const handleReplyMessage = useCallback((message: Message) => {
    setReplyingTo(message)
  }, [])

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket || !currentRoom) return
    socket.emit('message:reaction', { messageId, emoji, room: currentRoom })
  }, [socket, currentRoom])

  // WebRTC Functions
  const handleEndCall = useCallback(() => {
    if (socket && targetCallUser) {
      socket.emit('call:end', {
        to: targetCallUser,
      })
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    setIsCallModalOpen(false)
    setCallStatus('ended')
    setTargetCallUser('')
  }, [socket, targetCallUser, localStream, remoteStream])

  const createPeerConnection = useCallback((targetUser: string) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    }
    
    const pc = new RTCPeerConnection(configuration)
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate to:', targetUser)
        socket.emit('call:ice-candidate', {
          to: targetUser,
          candidate: event.candidate,
        })
      } else if (!event.candidate) {
        console.log('✅ ICE gathering complete')
      }
    }
    
    pc.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind)
      setRemoteStream(event.streams[0])
    }
    
    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState)
    }
    
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        setCallStatus('connected')
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        handleEndCall()
      }
    }
    
    return pc
  }, [socket])

  const handleStartCall = useCallback(async (targetUser: string, type: 'voice' | 'video') => {
    console.log('📞 Starting call to:', targetUser, 'Type:', type)
    try {
      setTargetCallUser(targetUser)
      setCallType(type)
      setIsIncomingCall(false)
      setIsCallModalOpen(true)
      setCallStatus('calling')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      })
      console.log('✅ Got local stream')

      setLocalStream(stream)

      const pc = createPeerConnection(targetUser)
      peerConnectionRef.current = pc

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('📤 Sending offer to:', targetUser)

      if (socket) {
        socket.emit('call:offer', {
          to: targetUser,
          offer: offer,
          callType: type,
          from: username,
        })
      }
    } catch (error) {
      console.error('Error starting call:', error)
      alert('Không thể truy cập camera/microphone')
      handleEndCall()
    }
  }, [socket, username, createPeerConnection])

  const handleAcceptCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      })
      
      setLocalStream(stream)
      setCallStatus('connected')
      
      // Use existing peer connection (already created in call:incoming)
      const pc = peerConnectionRef.current
      if (!pc) {
        console.error('❌ No peer connection found when accepting call')
        return
      }
      
      // Add local tracks to existing peer connection
      stream.getTracks().forEach(track => {
        console.log('➕ Adding local track:', track.kind)
        pc.addTrack(track, stream)
      })
      
      // Create and send answer (remote description already set in call:incoming)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      console.log('📤 Sending answer to:', targetCallUser)
      
      if (socket) {
        socket.emit('call:answer-sdp', {
          to: targetCallUser,
          answer: answer,
        })
        
        socket.emit('call:answer', {
          to: targetCallUser,
          accepted: true,
        })
      }
      
      setIncomingOffer(null)
    } catch (error) {
      console.error('Error accepting call:', error)
      alert('Không thể truy cập camera/microphone')
      // Don't call handleRejectCall here to avoid circular dependency
      if (socket && targetCallUser) {
        socket.emit('call:answer', {
          to: targetCallUser,
          accepted: false,
        })
      }
      setIsCallModalOpen(false)
      setCallStatus('ended')
    }
  }, [socket, targetCallUser, callType, incomingOffer])

  const handleRejectCall = useCallback(() => {
    if (socket && targetCallUser) {
      socket.emit('call:answer', {
        to: targetCallUser,
        accepted: false,
      })
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    setIsCallModalOpen(false)
    setCallStatus('ended')
    setTargetCallUser('')
  }, [socket, targetCallUser, localStream, remoteStream])

  // Chuyển đổi Set thành Array với useMemo
  const typingUsersArray = useMemo(() => {
    const arr: string[] = []
    typingUsers.forEach(user => arr.push(user))
    return arr
  }, [typingUsers])

  // Request user rooms when socket connects
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('user:getRooms')
    }
  }, [socket, isConnected])

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
  if (!currentRoom) {
    return <RoomSelector username={username} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLeaveRoom={handleLeaveRoomFromSelector} existingRooms={userRooms} />
  }

  // Show chat room
  return (
    <>
      <ChatRoom
        username={username}
        room={currentRoom}
        messages={messages}
        users={users}
        typingUsers={typingUsersArray}
        roomCreatedBy={roomCreatedBy}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onRecallMessage={handleRecallMessage}
        onReplyMessage={handleReplyMessage}
        onReaction={handleReaction}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onLeaveRoom={handleLeaveRoom}
        onDeleteRoom={handleDeleteRoom}
        onAddRoom={handleAddRoom}
        onLogout={handleLogout}
        onStartCall={handleStartCall}
        isConnected={isConnected}
        userRooms={userRooms}
        onSelectRoom={handleJoinRoom}
      />
      
      <CallModal
        isOpen={isCallModalOpen}
        callType={callType}
        isIncoming={isIncomingCall}
        callerName={callerName}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEndCall={handleEndCall}
        localStream={localStream}
        remoteStream={remoteStream}
        callStatus={callStatus}
      />
    </>
  )
}

