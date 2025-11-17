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

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
  file?: FileInfo
  isRecalled?: boolean
  recalledAt?: Date
  recalledBy?: string
}

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
  isSystemMessage: boolean
  onRecallMessage: (messageId: string) => void
  isDarkMode?: boolean
}

export default function ChatMessage({ message, isOwnMessage, isSystemMessage, onRecallMessage, isDarkMode = false }: ChatMessageProps) {
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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <div className="flex items-end gap-2">
        {/* Nút thu hồi (chỉ hiện khi hover và có thể thu hồi) */}
        {canRecall() && (
          <button
            onClick={handleRecall}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
              isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="Thu hồi tin nhắn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        )}

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
            <div className="text-sm break-words whitespace-pre-wrap">{message.text}</div>
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
      </div>
    </div>
  )
}

