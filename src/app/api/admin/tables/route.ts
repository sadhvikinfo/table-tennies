import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tables = await prisma.table.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ tables })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const table = await prisma.table.create({
    data: {
      name: body.name,
      locationDescription: body.locationDescription,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json({ table }, { status: 201 })
}
