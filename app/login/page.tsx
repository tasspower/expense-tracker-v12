'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (res?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 mb-3 border border-indigo-500/30">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ Expense Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">จัดการรายรับ-รายจ่ายของคุณได้อย่างมีประสิทธิภาพ</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {/* Social Logins */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 hover:bg-slate-100 font-medium py-2.5 px-4 rounded-xl transition duration-200 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Gmail (Google)
          </button>

          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 border border-slate-600 shadow-md"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider">หรือเข้าสู่ระบบด้วยอีเมล</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          ยังไม่มีบัญชีผู้ใช้?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4">
            สมัครสมาชิกที่นี่
          </Link>
        </div>
      </div>
    </div>
  )
}
