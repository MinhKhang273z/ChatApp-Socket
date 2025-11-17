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
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Đếm thời gian ghi âm
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Không thể truy cập microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioBlob(null)
      setRecordingTime(0)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const sendVoiceMessage = async () => {
    if (!audioBlob) return

    try {
      setIsUploading(true)
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      await onSendMessage('', audioFile)
      setAudioBlob(null)
      setRecordingTime(0)
    } catch (err) {
      setError('Không thể gửi tin nhắn voice')
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()

    // Validate - phải có text HOẶC file HOẶC audio
    if (!trimmedMessage && !selectedFile && !audioBlob) {
      setError('Vui lòng nhập tin nhắn, chọn file hoặc ghi âm')
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự`)
      return
    }

    // Gửi tin nhắn
    setIsUploading(true)
    try {
      if (audioBlob) {
        await sendVoiceMessage()
      } else {
        await onSendMessage(trimmedMessage, selectedFile || undefined)
        setMessage('')
        setSelectedFile(null)
        setError('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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

        {/* Voice recording preview */}
        {audioBlob && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <span className="text-2xl">🎤</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Voice Message Ready
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isDarkMode 
                    ? 'bg-green-600 text-green-100' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {formatTime(recordingTime)}
                </span>
              </div>
              
              {/* Custom audio player */}
              <div className="flex items-center gap-2">
                <audio controls className="flex-1 h-8" style={{ maxWidth: '200px' }}>
                  <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                </audio>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAudioBlob(null)}
              className={`p-2 rounded-full transition ${
                isDarkMode 
                  ? 'hover:bg-red-600 text-gray-400 hover:text-white' 
                  : 'hover:bg-red-500 text-gray-600 hover:text-white'
              }`}
              title="Xóa voice message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className={`relative overflow-hidden rounded-lg ${
            isDarkMode ? 'bg-gradient-to-r from-red-900 to-red-800' : 'bg-gradient-to-r from-red-100 to-red-200'
          }`}>
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
            
            <div className="relative flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {/* Pulsing record dot */}
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-red-100' : 'text-red-800'}`}>
                    🎤 Đang ghi âm...
                  </span>
                  <span className={`text-lg font-mono ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="group p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all transform hover:scale-110 shadow-lg"
                  title="Hoàn thành ghi âm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="group p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                  title="Hủy ghi âm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
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
            disabled={isRecording}
            className={`p-2 rounded-lg transition ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
            }`}
            title="Đính kèm file"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Voice recording button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={selectedFile !== null || audioBlob !== null}
            className={`relative p-2 rounded-lg transition-all transform hover:scale-105 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                : isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
            }`}
            title={isRecording ? "Dừng ghi âm" : "Ghi âm voice message"}
          >
            {isRecording && (
              <div className="absolute inset-0 rounded-lg bg-red-400 animate-ping opacity-75"></div>
            )}
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            disabled={isRecording}
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                : 'bg-white border-gray-300 text-black placeholder:text-gray-400'
            }`}
            autoComplete="off"
          />
          
          {audioBlob ? (
            <button
              type="button"
              onClick={sendVoiceMessage}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi Voice
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!message.trim() && !selectedFile && !audioBlob) || isUploading || isRecording}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? 'Đang gửi...' : 'Gửi'}
            </button>
          )}
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

