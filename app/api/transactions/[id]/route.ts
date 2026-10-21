import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations/transaction'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const updated = await prisma.transaction.update({
      where: { id: params.id, userId: session.user.id },
      data: validation.data,
      include: { category: true }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.transaction.delete({
      where: { id: params.id, userId: session.user.id }
    })

    return NextResponse.json({ success: true, message: 'Transaction deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 500 })
  }
}
