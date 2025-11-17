'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void
  onTyping: (isTyping: boolean) => void
  isDarkMode?: boolean
}

const MAX_MESSAGE_LENGTH = 1000
const TYPING_TIMEOUT = 2000 // 2 giây

export default function MessageInput({ onSendMessage, onTyping, isDarkMode = false }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Kiểm tra kích thước file (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File không được vượt quá 10MB')
      return
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận hình ảnh, PDF, Word, và text files')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()

    // Validate - phải có text HOẶC file
    if (!trimmedMessage && !selectedFile) {
      setError('Vui lòng nhập tin nhắn hoặc chọn file')
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự`)
      return
    }

    // Gửi tin nhắn
    setIsUploading(true)
    try {
      await onSendMessage(trimmedMessage, selectedFile || undefined)
      setMessage('')
      setSelectedFile(null)
      setError('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Không thể gửi tin nhắn')
    } finally {
      setIsUploading(false)
    }

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
    <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} p-4`}>
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* File preview */}
        {selectedFile && (
          <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex-1 flex items-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <span className="text-2xl">🖼️</span>
              ) : (
                <span className="text-2xl">📄</span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {selectedFile.name}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className={`p-1 rounded hover:bg-red-500 hover:text-white transition ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-lg transition ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Đính kèm file"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                : 'bg-white border-gray-300 text-black placeholder:text-gray-400'
            }`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>

        {/* Error message hoặc character count */}
        <div className="flex justify-between items-center min-h-[20px]">
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          {!error && showCharCount && (
            <p className={`text-xs ml-auto ${remainingChars < 50 ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {remainingChars} ký tự còn lại
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

