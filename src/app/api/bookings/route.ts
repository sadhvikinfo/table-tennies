import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLockHolder, releaseLock } from '@/lib/redis-lock'
import { z } from 'zod'

const bodySchema = z.object({
  tableId: z.string().min(1),
  slotId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { tableId, slotId, date, notes } = parsed.data
  const userId = session.user.id

  // 1. Verify Redis lock is held by this user
  const lockHolder = await getLockHolder(tableId, slotId, date)
  if (lockHolder !== userId) {
    return NextResponse.json(
      { error: 'Slot lock not held. Please select the slot again.' },
      { status: 409 }
    )
  }

  // 2. Check venue max bookings per day
  const venueSettings = await prisma.venueSettings.findFirst()
  if (venueSettings) {
    const todaysBookings = await prisma.booking.count({
      where: {
        userId,
        bookingDate: new Date(date),
        status: { not: 'CANCELLED' },
      },
    })
    if (todaysBookings >= venueSettings.maxBookingsPerUserPerDay) {
      await releaseLock(tableId, slotId, date, userId)
      return NextResponse.json(
        { error: `Max ${venueSettings.maxBookingsPerUserPerDay} bookings allowed per day.` },
        { status: 422 }
      )
    }
  }

  // 3. Prisma transaction: check DB constraint + create booking atomically
  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Double-check no active booking exists (DB-level safety net)
      const existing = await tx.booking.findFirst({
        where: {
          tableId,
          slotId,
          bookingDate: new Date(date),
          status: { not: 'CANCELLED' },
        },
      })

      if (existing) {
        throw new Error('DOUBLE_BOOKING')
      }

      return tx.booking.create({
        data: {
          userId,
          tableId,
          slotId,
          bookingDate: new Date(date),
          status: 'CONFIRMED',
          notes,
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          table: { select: { name: true, locationDescription: true } },
          slot: { select: { startTime: true, endTime: true } },
        },
      })
    })

    // 4. Release Redis lock on successful booking
    await releaseLock(tableId, slotId, date, userId)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: unknown) {
    await releaseLock(tableId, slotId, date, userId)

    if (error instanceof Error && error.message === 'DOUBLE_BOOKING') {
      return NextResponse.json(
        { error: 'This slot was just booked by someone else.' },
        { status: 409 }
      )
    }

    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const upcoming = searchParams.get('upcoming') === 'true'

  const where: Record<string, unknown> = {
    userId: session.user.role === 'ADMIN' ? undefined : session.user.id,
    ...(status && { status }),
    ...(upcoming && { bookingDate: { gte: new Date() } }),
  }

  // Remove undefined keys
  Object.keys(where).forEach((k) => where[k] === undefined && delete where[k])

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      table: { select: { name: true, locationDescription: true } },
      slot: { select: { startTime: true, endTime: true } },
    },
    orderBy: [{ bookingDate: 'asc' }, { slot: { displayOrder: 'asc' } }],
  })

  return NextResponse.json({ bookings })
}
