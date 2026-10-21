'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'การสมัครสมาชิกล้มเหลว')
      }

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 mb-3 border border-indigo-500/30">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-white">สมัครสมาชิกใหม่</h1>
          <p className="text-slate-400 text-sm mt-1">เริ่มต้นบันทึกรายรับ-รายจ่ายของคุณวันนี้</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">ชื่อ-นามสกุล / ชื่อเรียก</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="สมชาย ใจดี"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30 mt-2"
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'ยืนยันสมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  )
}
