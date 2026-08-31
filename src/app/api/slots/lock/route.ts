import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { acquireLock, getLockHolder, getLockTTL } from '@/lib/redis-lock'
import { z } from 'zod'

const bodySchema = z.object({
  tableId: z.string().min(1),
  slotId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { tableId, slotId, date } = parsed.data
  const userId = session.user.id

  // Check if this user already holds this lock
  const currentHolder = await getLockHolder(tableId, slotId, date)
  if (currentHolder === userId) {
    const ttl = await getLockTTL(tableId, slotId, date)
    return NextResponse.json({
      held: true,
      alreadyHeld: true,
      expiresIn: ttl,
    })
  }

  // Try to acquire atomic Redis lock
  const acquired = await acquireLock(tableId, slotId, date, userId)

  if (!acquired) {
    const holder = await getLockHolder(tableId, slotId, date)
    return NextResponse.json(
      {
        held: false,
        reason: holder ? 'Slot is being booked by another user' : 'Slot unavailable',
      },
      { status: 409 }
    )
  }

  const ttl = await getLockTTL(tableId, slotId, date)
  return NextResponse.json({
    held: true,
    expiresIn: ttl,
    expiresAt: Date.now() + ttl * 1000,
  })
}
