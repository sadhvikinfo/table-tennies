'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, formatTime, cn } from '@/lib/utils'
import type { BookingWithDetails } from '@/types'
import { Clock, QrCode, X, Loader2, ChevronRight } from 'lucide-react'
import { parseISO } from 'date-fns'

interface BookingCardProps {
  booking: BookingWithDetails
  canCancel: boolean
  dimmed?: boolean
}

export function BookingCard({ booking, canCancel, dimmed }: BookingCardProps) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(booking.status === 'CANCELLED')

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(true)
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'POST' })
    if (res.ok) {
      setCancelled(true)
    } else {
      const data = await res.json()
      alert(data.error ?? 'Could not cancel booking.')
    }
    setCancelling(false)
  }

  const statusColors = {
    CONFIRMED: 'text-green-400 bg-green-400/10 border-green-400/20',
    CANCELLED: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }

  const dateStr = booking.bookingDate.split('T')[0]

  return (
    <div className={cn(
      'glass rounded-xl overflow-hidden border transition-all hover:border-white/20',
      dimmed && 'opacity-60',
      cancelled && 'opacity-50'
    )}>
      <div className="p-4 flex items-start gap-4">
        {/* Date block */}
        <div className="flex-shrink-0 text-center bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 min-w-[52px]">
          <span className="text-xs font-medium text-primary uppercase block">
            {formatDate(parseISO(dateStr), 'MMM')}
          </span>
          <span className="text-xl font-bold leading-tight block">
            {formatDate(parseISO(dateStr), 'd')}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm truncate">{booking.table.name}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}
              </div>
            </div>
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
              statusColors[cancelled ? 'CANCELLED' : booking.status]
            )}>
              {cancelled ? 'Cancelled' : booking.status}
            </span>
          </div>

          {booking.notes && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{booking.notes}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {!cancelled && booking.status !== 'CANCELLED' && (
        <div className="flex border-t border-white/5">
          <Link
            href={`/booking/${booking.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
            View Pass
            <ChevronRight className="h-3 w-3" />
          </Link>

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors border-l border-white/5"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
