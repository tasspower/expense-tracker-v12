'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)

  // 5 Filter States
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')
  const [categoryId, setCategoryId] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  
  // Form State (Default EXPENSE first)
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formNote, setFormNote] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchCategories()
      fetchTransactions()
    }
  }, [status, router])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (json.success) {
        setCategories(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    triggerSpin()
    try {
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (type !== 'ALL') query.append('type', type)
      if (categoryId !== 'ALL') query.append('categoryId', categoryId)
      if (startDate) query.append('startDate', startDate)
      if (endDate) query.append('endDate', endDate)

      const res = await fetch(`/api/transactions?${query.toString()}`)
      const json = await res.json()
      if (json.success) {
        setTransactions(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const triggerSpin = () => {
    setIsSpinning(true)
    setTimeout(() => setIsSpinning(false), 600)
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTransactions()
  }

  const handleResetFilter = () => {
    setSearch('')
    setType('ALL')
    setCategoryId('ALL')
    setStartDate('')
    setEndDate('')
    setTimeout(() => {
      fetchTransactions()
    }, 50)
  }

  const handleOpenCreateModal = () => {
    setEditId(null)
    setFormType('EXPENSE') // Default to EXPENSE
    setFormTitle('')
    setFormAmount('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormNote('')
    setFormError('')
    
    const defaultCat = categories.find(c => c.type === 'EXPENSE')
    setFormCategoryId(defaultCat ? defaultCat.id : '')
    
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: any) => {
    setEditId(item.id)
    setFormType(item.type)
    setFormTitle(item.title)
    setFormAmount(item.amount.toString())
    setFormCategoryId(item.categoryId)
    setFormDate(new Date(item.date).toISOString().split('T')[0])
    setFormNote(item.note || '')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formTitle.trim()) {
      setFormError('กรุณากรอกชื่อรายการ')
      return
    }
    if (!formAmount || parseFloat(formAmount) <= 0) {
      setFormError('จำนวนเงินต้องมากกว่า 0')
      return
    }
    if (!formCategoryId) {
      setFormError('กรุณาเลือกหมวดหมู่')
      return
    }

    try {
      const payload = {
        title: formTitle,
        amount: parseFloat(formAmount),
        type: formType,
        categoryId: formCategoryId,
        date: formDate,
        note: formNote
      }

      const url = editId ? `/api/transactions/${editId}` : '/api/transactions'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (json.success) {
        setIsModalOpen(false)
        fetchTransactions()
      } else {
        setFormError(json.error || 'บันทึกรายการไม่สำเร็จ')
      }
    } catch (err) {
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        fetchTransactions()
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบรายการ')
    }
  }

  // Calculate totals & stats
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  // Expenses by Category
  const expenseByCategory: { [key: string]: { name: string, amount: number } } = {}
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const catName = t.category?.name || 'อื่นๆ'
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = { name: catName, amount: 0 }
      }
      expenseByCategory[catName].amount += t.amount
    })

  const expenseCategoryList = Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount)
  const topExpenseCategory = expenseCategoryList.length > 0 ? expenseCategoryList[0].name : 'ไม่มีข้อมูล'

  // Income by Category
  const incomeByCategory: { [key: string]: { name: string, amount: number } } = {}
  transactions
    .filter(t => t.type === 'INCOME')
    .forEach(t => {
      const catName = t.category?.name || 'อื่นๆ'
      if (!incomeByCategory[catName]) {
        incomeByCategory[catName] = { name: catName, amount: 0 }
      }
      incomeByCategory[catName].amount += t.amount
    })

  const incomeCategoryList = Object.values(incomeByCategory).sort((a, b) => b.amount - a.amount)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  const filteredCategories = categories.filter(c => c.type === formType)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Top Navbar Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl mb-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-2xl border border-indigo-500/30">
            💎
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Expense Tracker System
              {session?.user?.role === 'ADMIN' && (
                <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/40">ADMIN</span>
              )}
            </h1>
            <p className="text-sm text-slate-300">
              👤 ยินดีต้อนรับคุณ <span className="text-indigo-400 font-bold">{session?.user?.name || session?.user?.email}</span> ({session?.user?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-purple-600/30 border border-purple-400/40 flex items-center gap-1.5"
            >
              🛡️ ระบบผู้ดูแล (Admin)
            </Link>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-1.5"
          >
            ➕ บันทึกรายการใหม่
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3.5 py-2 rounded-xl text-sm font-medium transition border border-slate-600"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">รายรับรวม</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg">💰</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            +฿{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">รายจ่ายรวม</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-lg">💸</span>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">
            -฿{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">ยอดเงินคงเหลือ</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-lg">⚖️</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${balance >= 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
            ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">รายการทั้งหมด / ใช้สูงสุด</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-lg">📊</span>
          </div>
          <p className="text-xl font-bold text-white mt-2">
            {transactions.length} รายการ
          </p>
          <p className="text-xs text-purple-300 mt-0.5 truncate">
            สูงสุด: {topExpenseCategory}
          </p>
        </div>
      </div>

      {/* 5 Filter Controls */}
      <div className="max-w-7xl mx-auto bg-slate-800/90 border border-slate-700 p-6 rounded-2xl mb-8 shadow-xl">
        <h2 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <span>🔍</span> ค้นหาและคัดกรองข้อมูล (5 ตัวเลือก)
        </h2>
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">1. ค้นหาชื่อ/โน้ต</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์คำค้นหา..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">2. ประเภทรายการ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">ทั้งหมด (All Types)</option>
              <option value="EXPENSE">🔴 รายจ่าย (Expense)</option>
              <option value="INCOME">🟢 รายรับ (Income)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">3. หมวดหมู่</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">ทุกหมวดหมู่ (All Categories)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === 'INCOME' ? '🟢' : '🔴'} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">4. ตั้งแต่วันที่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">5. ถึงวันที่</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-5 flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={handleResetFilter}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-xl transition border border-slate-600"
            >
              🔄 ล้างการค้นหาและกรอง
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
            >
              🔍 กรองข้อมูล
            </button>
          </div>
        </form>
      </div>

      {/* 3 Separate Analytics Graphs */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Graph 1: Expense Breakdown */}
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <span>🔴</span> 1. สัดส่วนรายจ่ายตามหมวดหมู่
            </h3>

            <div className="relative flex justify-center py-6">
              <div className={`w-40 h-40 rounded-full border-8 border-rose-500/80 border-t-rose-400/20 flex items-center justify-center transition-all duration-500 ${isSpinning ? 'spin-effect' : ''}`}>
                <div className="text-center">
                  <span className="text-xs text-slate-400 block">รายจ่ายรวม</span>
                  <span className="text-lg font-bold text-rose-400">
                    ฿{totalExpense.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
              {expenseCategoryList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">ไม่มีข้อมูลรายจ่าย</p>
              ) : (
                expenseCategoryList.map((item, idx) => {
                  const pct = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : '0'
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-slate-300 font-medium truncate">{item.name}</span>
                      <div className="text-right">
                        <span className="text-rose-400 font-bold mr-2">฿{item.amount.toLocaleString()}</span>
                        <span className="text-slate-500">({pct}%)</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Graph 2: Income Breakdown */}
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <span>🟢</span> 2. สัดส่วนรายรับตามหมวดหมู่
            </h3>

            <div className="relative flex justify-center py-6">
              <div className={`w-40 h-40 rounded-full border-8 border-emerald-500/80 border-t-emerald-400/20 flex items-center justify-center transition-all duration-500 ${isSpinning ? 'spin-effect' : ''}`}>
                <div className="text-center">
                  <span className="text-xs text-slate-400 block">รายรับรวม</span>
                  <span className="text-lg font-bold text-emerald-400">
                    ฿{totalIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
              {incomeCategoryList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">ไม่มีข้อมูลรายรับ</p>
              ) : (
                incomeCategoryList.map((item, idx) => {
                  const pct = totalIncome > 0 ? ((item.amount / totalIncome) * 100).toFixed(1) : '0'
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-slate-300 font-medium truncate">{item.name}</span>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold mr-2">฿{item.amount.toLocaleString()}</span>
                        <span className="text-slate-500">({pct}%)</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Graph 3: Comparison Income vs Expense */}
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <span>⚖️</span> 3. เปรียบเทียบรายรับ vs รายจ่าย
            </h3>

            <div className="py-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>🟢 รายรับ ({totalIncome.toLocaleString()} บาท)</span>
                  <span>{totalIncome + totalExpense > 0 ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${totalIncome + totalExpense > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>🔴 รายจ่าย ({totalExpense.toLocaleString()} บาท)</span>
                  <span>{totalIncome + totalExpense > 0 ? Math.round((totalExpense / (totalIncome + totalExpense)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${totalIncome + totalExpense > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center mt-4">
              <span className="text-xs text-slate-400 block mb-1">ดัชนีสุขภาพทางการเงิน</span>
              <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {balance >= 0 ? '✅ งบประมาณเป็นบวก (มีเงินเก็บสะสม)' : '⚠️ รายจ่ายมากกว่ารายรับ (ควรปรับลดรายจ่าย)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="max-w-7xl mx-auto bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> ประวัติการบันทึกรายรับ-รายจ่าย
          </h2>
          <span className="text-xs text-slate-400">แสดงผลข้อมูลจริงตามผู้ใช้</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">ชื่อรายการ</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    ไม่พบข้อมูลรายการบันทึก
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {item.title}
                      {item.note && <span className="block text-xs text-slate-400 font-normal">{item.note}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.category?.name || 'ไม่ระบุ'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.type === 'INCOME'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {item.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                      item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.type === 'INCOME' ? '+' : '-'}฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="bg-slate-700 hover:bg-slate-600 text-indigo-300 text-xs px-2.5 py-1 rounded-lg border border-slate-600"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(item.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-2.5 py-1 rounded-lg border border-red-500/40"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                {editId ? '✏️ แก้ไขรายการ' : '➕ บันทึกรายการใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type selector (EXPENSE first) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">ประเภทรายการ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('EXPENSE')
                      const firstCat = categories.find(c => c.type === 'EXPENSE')
                      if (firstCat) setFormCategoryId(firstCat.id)
                    }}
                    className={`py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border ${
                      formType === 'EXPENSE'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    💸 รายจ่าย (Expense)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('INCOME')
                      const firstCat = categories.find(c => c.type === 'INCOME')
                      if (firstCat) setFormCategoryId(firstCat.id)
                    }}
                    className={`py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border ${
                      formType === 'INCOME'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    💰 รายรับ (Income)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ชื่อรายการ</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น ข้าวผัดกะเพรา, เงินเดือน"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">หมวดหมู่</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">วันที่เกิดรายการ</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">หมายเหตุ (Optional)</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="บันทึกเพิ่มเติม..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
