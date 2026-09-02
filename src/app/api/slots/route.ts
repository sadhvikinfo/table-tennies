import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLockedSlots } from '@/lib/redis-lock'
import { auth } from '@/lib/auth'
import { isPastSlot } from '@/lib/utils'
import { z } from 'zod'

const querySchema = z.object({
  tableId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    tableId: searchParams.get('tableId'),
    date: searchParams.get('date'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }

  const { tableId, date } = parsed.data

  // Return empty slots for weekends
  const targetDate = new Date(date + 'T00:00:00')
  if (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
    return NextResponse.json({ slots: [], isWeekend: true })
  }

  // Fetch all slots
  const [slots, bookings, lockedSlots] = await Promise.all([
    prisma.slot.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.booking.findMany({
      where: {
        tableId,
        bookingDate: new Date(date),
        status: { not: 'CANCELLED' },
      },
      include: { user: { select: { name: true } } },
    }),
    getLockedSlots(tableId, date),
  ])

  const bookedMap = new Map(bookings.map((b) => [b.slotId, b]))
  const lockedMap = new Map(lockedSlots.map((l) => [l.slotId, l.userId]))

  const slotsWithStatus = slots.map((slot) => {
    const booked = bookedMap.get(slot.id)
    const lockedByUserId = lockedMap.get(slot.id)
    const past = isPastSlot(date, slot.endTime)

    let status: string

    if (past) {
      status = 'PAST'
    } else if (booked) {
      status = booked.userId === session.user.id ? 'MY_BOOKING' : 'BOOKED'
    } else if (lockedByUserId) {
      status = lockedByUserId === session.user.id ? 'MY_HOLD' : 'LOCKED'
    } else {
      status = 'AVAILABLE'
    }

    return {
      ...slot,
      status,
      bookingId: booked?.id,
      bookedByName: booked?.user?.name,
      notes: booked?.notes,
      lockedByMe: lockedByUserId === session.user.id,
    }
  })

  return NextResponse.json({ slots: slotsWithStatus })
}
