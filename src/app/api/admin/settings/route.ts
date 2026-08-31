import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await prisma.venueSettings.findFirst()
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const existing = await prisma.venueSettings.findFirst()

  const settings = existing
    ? await prisma.venueSettings.update({ where: { id: existing.id }, data: body })
    : await prisma.venueSettings.create({ data: body })

  return NextResponse.json({ settings })
}
