import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { releaseLock } from '@/lib/redis-lock'
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
  const released = await releaseLock(tableId, slotId, date, session.user.id)

  return NextResponse.json({ released })
}
