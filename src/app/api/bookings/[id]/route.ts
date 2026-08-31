import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      table: { select: { name: true, locationDescription: true } },
      slot: { select: { startTime: true, endTime: true } },
    },
  })

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Players can only view their own bookings
  if (session.user.role !== 'ADMIN' && booking.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ booking })
}
