'use client'

import { useState, useRef, useEffect } from 'react'

// Voice Message Component
interface VoiceMessageProps {
  audioUrl: string
  isOwnMessage: boolean
  isDarkMode: boolean
}

function VoiceMessage({ audioUrl, isOwnMessage, isDarkMode }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg min-w-[200px] ${
      isOwnMessage
        ? 'bg-blue-700'
        : isDarkMode
        ? 'bg-gray-600'
        : 'bg-gray-300'
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOwnMessage
            ? 'bg-blue-800 hover:bg-blue-900 text-white'
            : isDarkMode
            ? 'bg-gray-700 hover:bg-gray-800 text-white'
            : 'bg-gray-400 hover:bg-gray-500 text-white'
        }`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Waveform và Progress */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform visual */}
        <div className="flex items-center gap-1 h-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                i < (progress / 5) 
                  ? isOwnMessage
                    ? 'bg-blue-200'
                    : isDarkMode
                    ? 'bg-gray-300'
                    : 'bg-gray-600'
                  : isOwnMessage
                  ? 'bg-blue-800'
                  : isDarkMode
                  ? 'bg-gray-700'
                  : 'bg-gray-400'
              }`}
              style={{ 
                height: `${Math.random() * 16 + 8}px`,
                opacity: i < (progress / 5) ? 1 : 0.5
              }}
            />
          ))}
        </div>

        {/* Time */}
        <div className={`text-xs ${
          isOwnMessage
            ? 'text-blue-100'
            : isDarkMode
            ? 'text-gray-300'
            : 'text-gray-600'
        }`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Voice icon */}
      <div className={`text-lg ${
        isOwnMessage
          ? 'text-blue-200'
          : isDarkMode
          ? 'text-gray-300'
          : 'text-gray-600'
      }`}>
        🎤
      </div>
    </div>
  )
}

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

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
  isSystemMessage: boolean
  onRecallMessage: (messageId: string) => void
  onReplyMessage: (message: Message) => void
  onReaction: (messageId: string, emoji: string) => void
  isDarkMode?: boolean
}

export default function ChatMessage({ message, isOwnMessage, isSystemMessage, onRecallMessage, onReplyMessage, onReaction, isDarkMode = false }: ChatMessageProps) {
  const [showAllReactions, setShowAllReactions] = useState(false)
  const reactionDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionDropdownRef.current && !reactionDropdownRef.current.contains(event.target as Node)) {
        setShowAllReactions(false)
      }
    }

    if (showAllReactions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAllReactions])

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isImage = (mimetype: string) => {
    return mimetype.startsWith('image/')
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️'
    if (mimetype.startsWith('audio/')) return '🎤'
    if (mimetype === 'application/pdf') return '📄'
    if (mimetype.includes('word')) return '📝'
    return '📎'
  }

  const isAudio = (mimetype: string) => {
    return mimetype.startsWith('audio/')
  }

  const canRecall = () => {
    if (!isOwnMessage || isSystemMessage || message.isRecalled) return false
    
    // Cho phép thu hồi bất cứ lúc nào
    return true
  }

  const handleRecall = () => {
    if (window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
      // Sử dụng _id nếu id không tồn tại
      const messageId = message.id || (message as any)._id
      console.log('Message object:', message)
      console.log('Using messageId:', messageId)
      onRecallMessage(messageId)
    }
  }

  const handleReply = () => {
    onReplyMessage(message)
  }

  const handleReactionClick = (emoji: string) => {
    const messageId = message.id || (message as any)._id
    onReaction(messageId, emoji)
  }

  const reactions = ['❤️', '👍', '😂', '😮', '😢', '😡']
  const allReactions = ['❤️', '👍', '😂', '😮', '😢', '😡', '👏', '🔥', '💯', '🎉', '😍', '🤔', '😭', '🙄', '😴', '🤯']
  
  const renderMentions = (text: string) => {
    if (!text) return text
    
    return text.replace(/@(\w+)/g, (match, username) => {
      return `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${username}</span>`
    })
  }

  // Nếu tin nhắn đã bị thu hồi
  if (message.isRecalled) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
        }`}>
          <div className="text-sm italic flex items-center gap-2">
            <span>🔄</span>
            <span>Tin nhắn đã được thu hồi</span>
          </div>
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatTime(message.recalledAt || message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}>
      <div className="flex items-end gap-2">
        {/* Action buttons (chỉ hiện khi hover) */}
        {!isSystemMessage && (
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${
            isOwnMessage ? 'order-2' : 'order-1'
          }`}>
            <button
              onClick={handleReply}
              className={`p-1 rounded ${
                isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Trả lời"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            
            {canRecall() && (
              <button
                onClick={handleRecall}
                className={`p-1 rounded ${
                  isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
                title="Thu hồi tin nhắn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className={`${isOwnMessage ? 'order-1' : 'order-2'}`}>
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              isSystemMessage
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-300 text-center mx-auto'
                  : 'bg-gray-100 text-gray-600 text-center mx-auto'
                : isOwnMessage
                ? 'bg-blue-600 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-100'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {!isSystemMessage && (
              <div className={`text-xs mb-1 font-semibold ${
                isOwnMessage
                  ? 'text-blue-100'
                  : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}>
                {message.username}
              </div>
            )}

            {/* Reply preview */}
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded border-l-2 text-xs ${
                isOwnMessage
                  ? 'bg-blue-700 border-blue-300'
                  : isDarkMode
                  ? 'bg-gray-600 border-gray-400'
                  : 'bg-gray-100 border-gray-400'
              }`}>
                <div className={`font-medium mb-1 ${
                  isOwnMessage ? 'text-blue-200' : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  ↳ {message.replyTo.username}
                </div>
                <div className={`opacity-75 line-clamp-2 ${
                  isOwnMessage ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.replyTo.text || (message.replyTo.file ? `📎 ${message.replyTo.file.originalName}` : 'Tin nhắn')}
                </div>
              </div>
            )}
          
          {/* Hiển thị file nếu có */}
          {message.file && (
            <div className="mb-2">
              {isImage(message.file.mimetype) ? (
                <a 
                  href={`http://localhost:3001${message.file.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={`http://localhost:3001${message.file.url}`}
                    alt={message.file.originalName}
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                    style={{ maxHeight: '300px' }}
                  />
                </a>
              ) : isAudio(message.file.mimetype) ? (
                <VoiceMessage 
                  audioUrl={`http://localhost:3001${message.file.url}`}
                  isOwnMessage={isOwnMessage}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <a
                  href={`http://localhost:3001${message.file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded ${
                    isOwnMessage
                      ? 'bg-blue-700 hover:bg-blue-800'
                      : isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-500'
                      : 'bg-gray-300 hover:bg-gray-400'
                  } transition`}
                >
                  <span className="text-2xl">{getFileIcon(message.file.mimetype)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.file.originalName}</p>
                    <p className="text-xs opacity-75">{(message.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </a>
              )}
            </div>
          )}
          
            {message.text && (
              <div 
                className="text-sm break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderMentions(message.text) }}
              />
            )}
            
            <div className={`text-xs mt-1 ${
              isOwnMessage
                ? 'text-blue-100'
                : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </div>
          </div>

          {/* Reactions - chỉ hiển thị reactions có người dùng */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {/* Group reactions by emoji */}
              {Object.entries(
                message.reactions.reduce((acc: Record<string, any[]>, reaction) => {
                  if (!acc[reaction.emoji]) acc[reaction.emoji] = []
                  acc[reaction.emoji].push(reaction)
                  return acc
                }, {})
              ).map(([emoji, reactionList]) => {
                const userReacted = reactionList.some((r: any) => r.username === message.username)
                
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                      userReacted
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={`${reactionList.map((r: any) => r.username).join(', ')}`}
                  >
                    <span>{emoji}</span>
                    <span>{reactionList.length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick reactions (hiện khi hover) - đặt bên cạnh action buttons */}
          {!isSystemMessage && (
            <div className="relative" ref={reactionDropdownRef}>
              <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute ${
                isOwnMessage ? 'right-12' : 'left-12'
              } top-0 flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border p-1 z-10`}>
                {reactions.slice(0, 4).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs transition"
                    title={`React với ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setShowAllReactions(!showAllReactions)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs transition"
                  title="Thêm reaction"
                >
                  ➕
                </button>
              </div>

              {/* All reactions dropdown */}
              {showAllReactions && (
                <div className={`absolute ${
                  isOwnMessage ? 'right-0' : 'left-0'
                } top-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-2 z-20 grid grid-cols-8 gap-1 max-w-xs`}>
                  {allReactions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReactionClick(emoji)
                        setShowAllReactions(false)
                      }}
                      className="w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-sm transition"
                      title={`React với ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

