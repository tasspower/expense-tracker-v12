import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { transactions: true, categories: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalTransactions = await prisma.transaction.count()
    const allTransactions = await prisma.transaction.aggregate({
      _sum: { amount: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        users,
        totalUsers: users.length,
        totalTransactions,
        totalVolume: allTransactions._sum.amount || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch admin users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { userId, role } = await request.json()
    if (!userId || !['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update user role' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}
