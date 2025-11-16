'use client'

import { useEffect, useRef, useState } from 'react'

interface CallModalProps {
  isOpen: boolean
  callType: 'voice' | 'video'
  isIncoming: boolean
  callerName?: string
  onAccept: () => void
  onReject: () => void
  onEndCall: () => void
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callStatus: 'calling' | 'connected' | 'ended'
}

export default function CallModal({
  isOpen,
  callType,
  isIncoming,
  callerName,
  onAccept,
  onReject,
  onEndCall,
  localStream,
  remoteStream,
  callStatus,
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
              </h2>
              <p className="text-indigo-100 mt-1">
                {callStatus === 'calling' && !isIncoming && 'Đang gọi...'}
                {callStatus === 'calling' && isIncoming && `${callerName} đang gọi`}
                {callStatus === 'connected' && 'Đã kết nối'}
                {callStatus === 'ended' && 'Cuộc gọi đã kết thúc'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {callStatus === 'connected' && (
                <>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video/Voice Content */}
        <div className={`relative bg-gray-900 ${callType === 'video' ? 'h-[500px]' : 'h-[300px]'}`}>
          {callType === 'video' ? (
            <>
              {/* Remote Video (Full Screen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture in Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <span className="text-white text-4xl">📷</span>
                  </div>
                )}
              </div>

              {/* No Remote Video Placeholder */}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-6xl">👤</span>
                    </div>
                    <p className="text-white text-xl">{callerName || 'Đang chờ...'}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Voice Call UI
            <>
              {/* Hidden audio element for voice call */}
              <audio
                ref={remoteVideoRef}
                autoPlay
                playsInline
              />
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-indigo-500 to-purple-600">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <span className="text-8xl">📞</span>
                  </div>
                  <p className="text-white text-2xl font-semibold">{callerName || 'Người dùng'}</p>
                  {callStatus === 'connected' && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-8 bg-white rounded animate-pulse animation-delay-0"></div>
                        <div className="w-2 h-12 bg-white rounded animate-pulse animation-delay-150"></div>
                        <div className="w-2 h-10 bg-white rounded animate-pulse animation-delay-300"></div>
                        <div className="w-2 h-14 bg-white rounded animate-pulse animation-delay-450"></div>
                        <div className="w-2 h-8 bg-white rounded animate-pulse animation-delay-600"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white p-6">
          {callStatus === 'calling' && isIncoming ? (
            // Incoming Call Buttons
            <div className="flex justify-center gap-4">
              <button
                onClick={onReject}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Từ chối
              </button>
              <button
                onClick={onAccept}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Chấp nhận
              </button>
            </div>
          ) : callStatus === 'connected' ? (
            // Active Call Controls
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition shadow-lg ${
                  isMuted ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                {isMuted ? 'Bật mic' : 'Tắt mic'}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition shadow-lg ${
                    isVideoOff ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {isVideoOff ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  {isVideoOff ? 'Bật camera' : 'Tắt camera'}
                </button>
              )}

              <button
                onClick={onEndCall}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                Kết thúc
              </button>
            </div>
          ) : (
            // Calling/Ended state
            <div className="flex justify-center">
              <button
                onClick={callStatus === 'ended' ? onReject : onEndCall}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {callStatus === 'ended' ? 'Đóng' : 'Hủy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
