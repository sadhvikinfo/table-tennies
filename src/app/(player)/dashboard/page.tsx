import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { canCancel, getTodayDate } from '@/lib/utils'
import { Calendar, ChevronRight, Zap, Ticket, History } from 'lucide-react'
import { BookingCard } from '@/components/dashboard/BookingCard'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const today = getTodayDate()

  const [upcomingBookings, pastBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: 'CONFIRMED',
        bookingDate: { gte: today },
      },
      include: {
        slot: true,
        table: true,
      },
      orderBy: [{ bookingDate: 'asc' }, { slot: { displayOrder: 'asc' } }],
      take: 10,
    }),
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { status: 'CANCELLED' },
          { bookingDate: { lt: today } },
        ],
      },
      include: { slot: true, table: true },
      orderBy: { bookingDate: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          👋 Welcome back, <span className="text-gradient">{session.user.name}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your table tennis bookings below.
        </p>
      </div>

      {/* Quick book CTA */}
      <Link
        href="/book"
        className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-600/20 border border-cyan-500/20 px-5 py-4 hover:from-cyan-500/30 hover:to-violet-600/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">Book a Slot</p>
            <p className="text-xs text-muted-foreground">Check available slots for today</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </Link>

      {/* Upcoming bookings */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Upcoming Bookings</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {upcomingBookings.length} slot{upcomingBookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <Ticket className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            <Link
              href="/book"
              className="inline-block text-xs text-primary hover:underline mt-1"
            >
              Book your first slot →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={{
                  id: booking.id,
                  qrToken: booking.qrToken,
                  status: booking.status,
                  bookingDate: booking.bookingDate.toISOString(),
                  notes: booking.notes,
                  createdAt: booking.createdAt.toISOString(),
                  slot: booking.slot,
                  table: booking.table,
                  userId: booking.userId,
                  tableId: booking.tableId,
                  slotId: booking.slotId,
                  user: { name: session.user.name, email: session.user.email, phone: null },
                }}
                canCancel={canCancel(
                  booking.bookingDate.toISOString().split('T')[0],
                  booking.slot.startTime
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent history */}
      {pastBookings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-muted-foreground">Recent History</h2>
          </div>
          <div className="space-y-2">
            {pastBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={{
                  id: booking.id,
                  qrToken: booking.qrToken,
                  status: booking.status,
                  bookingDate: booking.bookingDate.toISOString(),
                  notes: booking.notes,
                  createdAt: booking.createdAt.toISOString(),
                  slot: booking.slot,
                  table: booking.table,
                  userId: booking.userId,
                  tableId: booking.tableId,
                  slotId: booking.slotId,
                  user: { name: session.user.name, email: session.user.email, phone: null },
                }}
                canCancel={false}
                dimmed
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
