import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canCancel } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  })

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Players can only cancel their own bookings
  if (session.user.role !== 'ADMIN' && booking.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  }

  // Enforce 2-hour cancellation window (players only)
  if (session.user.role !== 'ADMIN') {
    const dateStr = booking.bookingDate.toISOString().split('T')[0]
    if (!canCancel(dateStr, booking.slot.startTime)) {
      return NextResponse.json(
        { error: 'Cannot cancel within 2 hours of the slot start time.' },
        { status: 422 }
      )
    }
  }

  const cancelled = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ booking: cancelled })
}
