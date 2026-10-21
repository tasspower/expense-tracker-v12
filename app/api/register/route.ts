import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if this is the first user in the system -> set as ADMIN, else USER
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'USER'

    const user = await prisma.user.create({
      data: {
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        role: role
      }
    })

    // Seed default categories for this user only
    const defaultCategories = [
      { name: '🍔 อาหารและเครื่องดื่ม', type: 'EXPENSE' },
      { name: '🚗 การเดินทาง', type: 'EXPENSE' },
      { name: '🛍️ ช้อปปิ้ง', type: 'EXPENSE' },
      { name: '💡 ค่าน้ำค่าน้ำไฟ', type: 'EXPENSE' },
      { name: '🏠 ที่พักอาศัย', type: 'EXPENSE' },
      { name: '🎬 บันเทิง', type: 'EXPENSE' },
      { name: '🏥 สุขภาพ', type: 'EXPENSE' },
      { name: '👕 เสื้อผ้า', type: 'EXPENSE' },
      { name: '🎓 การศึกษา', type: 'EXPENSE' },
      { name: '📦 อื่นๆ', type: 'EXPENSE' },
      { name: '💰 เงินเดือน', type: 'INCOME' },
      { name: '💻 งานฟรีแลนซ์', type: 'INCOME' },
      { name: '📈 การลงทุน', type: 'INCOME' },
      { name: '🔄 ธุรกิจ/ค้าขาย', type: 'INCOME' },
      { name: '🎁 โบนัส/ของขวัญ', type: 'INCOME' },
      { name: '✨ รายได้พิเศษ', type: 'INCOME' },
      { name: '💵 รายรับอื่นๆ', type: 'INCOME' }
    ]

    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          userId: user.id
        }
      })
    }

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }, { status: 500 })
  }
}
