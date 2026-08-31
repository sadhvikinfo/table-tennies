import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import { parseISO } from 'date-fns'
import { BookingPass } from '@/components/dashboard/BookingPass'
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      table: true,
      slot: true,
    },
  })

  if (!booking) notFound()
  if (session.user.role !== 'ADMIN' && booking.userId !== session.user.id) {
    redirect('/dashboard')
  }

  const dateStr = booking.bookingDate.toISOString().split('T')[0]

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Booking pass card */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header gradient band */}
        <div className="bg-gradient-to-r from-cyan-500/80 to-violet-600/80 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80 uppercase tracking-widest">
                Booking Pass
              </p>
              <h1 className="text-xl font-bold mt-0.5">{booking.table.name}</h1>
              {booking.table.locationDescription && (
                <div className="flex items-center gap-1 text-xs opacity-80 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {booking.table.locationDescription}
                </div>
              )}
            </div>
            <CheckCircle className="h-10 w-10 opacity-90" />
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </div>
              <p className="text-sm font-semibold">{formatDate(parseISO(dateStr))}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Time
              </div>
              <p className="text-sm font-semibold">
                {formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-white/10" />

          {/* Player info */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Player</p>
            <p className="text-sm font-semibold">{booking.user.name}</p>
            <p className="text-xs text-muted-foreground">{booking.user.email}</p>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-white/10" />

          {/* QR Code */}
          <BookingPass qrToken={booking.qrToken} bookingId={booking.id} />

          <p className="text-center text-xs text-muted-foreground">
            Show this QR code at the reception for check-in
          </p>
        </div>
      </div>
    </div>
  )
}
