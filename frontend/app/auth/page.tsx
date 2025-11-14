'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const username = searchParams.get('username')
    const error = searchParams.get('error')

    if (error) {
      // Redirect về trang chủ với error
      router.push(`/?error=${encodeURIComponent(error)}`)
      return
    }

    if (token && username) {
      // Lưu token và username vào localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('username', username)
      
      // Redirect về trang chủ
      router.push('/')
    } else {
      // Không có token, redirect về trang chủ
      router.push('/')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}

