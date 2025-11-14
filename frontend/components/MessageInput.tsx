'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSendMessage: (text: string) => void
  onTyping: (isTyping: boolean) => void
}

const MAX_MESSAGE_LENGTH = 1000
const TYPING_TIMEOUT = 2000 // 2 giây

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Validate độ dài
    if (value.length > MAX_MESSAGE_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự`)
      return
    }

    setError('')
    setMessage(value)

    // Handle typing indicator
    if (!isTyping && value.trim().length > 0) {
      setIsTyping(true)
      onTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Nếu input rỗng, dừng typing ngay lập tức
    if (value.trim().length === 0) {
      setIsTyping(false)
      onTyping(false)
      return
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping(false)
    }, TYPING_TIMEOUT)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()

    // Validate
    if (!trimmedMessage) {
      setError('Tin nhắn không được để trống')
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự`)
      return
    }

    // Gửi tin nhắn
    onSendMessage(trimmedMessage)
    setMessage('')
    setError('')

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      onTyping(false)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Focus lại input
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Gửi tin nhắn khi nhấn Enter (không phải Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const remainingChars = MAX_MESSAGE_LENGTH - message.length
  const showCharCount = message.length > MAX_MESSAGE_LENGTH * 0.8

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black placeholder:text-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Gửi
          </button>
        </div>

        {/* Error message hoặc character count */}
        <div className="flex justify-between items-center min-h-[20px]">
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          {!error && showCharCount && (
            <p className={`text-xs ml-auto ${remainingChars < 50 ? 'text-red-500' : 'text-gray-500'}`}>
              {remainingChars} ký tự còn lại
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

