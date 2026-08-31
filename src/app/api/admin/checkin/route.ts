import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { qrToken, bookingId } = await req.json()

  const booking = await prisma.booking.findFirst({
    where: qrToken ? { qrToken } : { id: bookingId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      table: { select: { name: true } },
      slot: { select: { startTime: true, endTime: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ valid: false, error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ valid: false, error: 'Booking is cancelled', booking })
  }

  return NextResponse.json({ valid: true, booking })
}
