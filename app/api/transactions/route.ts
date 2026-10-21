import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations/transaction'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {
      userId: session.user.id,
      title: { contains: search }
    }

    if (type && type !== 'ALL') {
      whereClause.type = type
    }

    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = categoryId
    }

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) whereClause.date.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereClause.date.lte = end
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = transactionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.error.format() }, { status: 400 })
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        ...validation.data,
        userId: session.user.id
      },
      include: { category: true }
    })

    return NextResponse.json({ success: true, data: newTransaction }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create transaction' }, { status: 500 })
  }
}
