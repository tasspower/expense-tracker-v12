import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}
