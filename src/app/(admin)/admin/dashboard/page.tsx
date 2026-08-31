import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate, formatTime, getTodayDate } from '@/lib/utils'
import { format } from 'date-fns'
import { Users, Calendar, CheckCircle, XCircle, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const today = getTodayDate()

  const [totalUsers, todayBookings, allTables, recentBookings] = await Promise.all([
    prisma.user.count({ where: { role: 'PLAYER' } }),
    prisma.booking.count({
      where: { bookingDate: today, status: { not: 'CANCELLED' } },
    }),
    prisma.table.findMany(),
    prisma.booking.findMany({
      where: { bookingDate: { gte: today } },
      include: {
        user: { select: { name: true, email: true } },
        slot: true,
        table: true,
      },
      orderBy: [{ bookingDate: 'asc' }, { slot: { displayOrder: 'asc' } }],
      take: 30,
    }),
  ])

  const stats = [
    { label: 'Total Players', value: totalUsers, icon: Users, color: 'text-cyan-400' },
    { label: "Today's Bookings", value: todayBookings, icon: Calendar, color: 'text-violet-400' },
    { label: 'Active Tables', value: allTables.filter((t) => t.isActive).length, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Inactive Tables', value: allTables.filter((t) => !t.isActive).length, icon: XCircle, color: 'text-red-400' },
  ]

  const todayStr = format(today, 'yyyy-MM-dd')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(today, 'EEEE, dd MMMM yyyy')} — Live floor view
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Today's bookings */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Today&apos;s Slot Schedule</h2>
        </div>

        {recentBookings.filter((b) => b.bookingDate.toISOString().startsWith(todayStr)).length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
            No bookings today.
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Table</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings
                  .filter((b) => b.bookingDate.toISOString().startsWith(todayStr))
                  .map((booking) => (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {formatTime(booking.slot.startTime)}
                      </td>
                      <td className="px-4 py-3">{booking.table.name}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{booking.user.name}</p>
                          {booking.notes && (
                            <p className="text-xs text-cyan-400/90 font-normal">{booking.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground hidden sm:block">{booking.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
