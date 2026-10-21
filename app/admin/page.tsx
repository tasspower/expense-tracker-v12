'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user && session.user.role !== 'ADMIN') {
      setError('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin ผู้ดูแลระบบ')
      setLoading(false)
    } else if (session?.user?.role === 'ADMIN') {
      fetchAdminData()
    }
  }, [session, status, router])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'ดึงข้อมูลผู้ดูแลระบบไม่สำเร็จ')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })
      const json = await res.json()
      if (json.success) {
        fetchAdminData()
      } else {
        alert(json.error)
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์')
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${email}?`)) return
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.success) {
        fetchAdminData()
      } else {
        alert(json.error)
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูลผู้ดูแลระบบ...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-md bg-slate-800 border border-red-500/50 p-6 rounded-2xl text-center">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">เข้าถึงถูกปฏิเสธ</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium">
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl mb-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-2xl border border-purple-500/30">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              แผงควบคุมผู้ดูแลระบบ (Admin Panel)
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/40">ADMIN</span>
            </h1>
            <p className="text-xs text-slate-400">
              ผู้ใช้งานปัจจุบัน: <span className="text-indigo-300 font-semibold">{session?.user?.name || session?.user?.email}</span> ({session?.user?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition border border-slate-600 flex items-center gap-2"
          >
            📊 กลับหน้า Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Admin Summary Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">ผู้ใช้งานทั้งหมดในระบบ</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data?.totalUsers || 0} คน</h3>
            </div>
            <span className="text-3xl p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">👥</span>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">จำนวนรายการบันทึกทั้งระบบ</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data?.totalTransactions || 0} รายการ</h3>
            </div>
            <span className="text-3xl p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">📝</span>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">ยอดสะพัดรวมทั้งระบบ</p>
              <h3 className="text-3xl font-bold text-amber-400 mt-1">
                ฿{(data?.totalVolume || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="text-3xl p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">💎</span>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="max-w-7xl mx-auto bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span> จัดการผู้ใช้งานในระบบ (User Management)
          </h2>
          <button
            onClick={fetchAdminData}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-600"
          >
            🔄 รีเฟรชข้อมูล
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">ชื่อผู้ใช้</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">สิทธิ์ (Role)</th>
                <th className="py-3 px-4">วันที่สมัคร</th>
                <th className="py-3 px-4 text-center">จำนวนรายการ</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {data?.users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-700/40 transition">
                  <td className="py-3 px-4 font-medium text-white">{u.name || 'ไม่ระบุชื่อ'}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-400">
                    {u._count.transactions} รายการ
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-600"
                        title="เปลี่ยนสิทธิ์ระหว่าง USER / ADMIN"
                      >
                        {u.role === 'ADMIN' ? 'สลับเป็น USER' : 'สลับเป็น ADMIN'}
                      </button>
                      {u.id !== session?.user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-2.5 py-1 rounded-lg border border-red-500/40"
                        >
                          ลบผู้ใช้
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
