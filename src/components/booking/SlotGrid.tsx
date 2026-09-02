'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlotCell } from './SlotCell'
import { BookingModal } from './BookingModal'
import { SlotViewModal } from './SlotViewModal'
import { useSlotGrid } from '@/hooks/useSlotGrid'
import type { SlotWithStatus } from '@/types'
import { Loader2, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { cn, isPastSlot } from '@/lib/utils'

interface SlotGridProps {
  tableId: string
  date: string
}

const legendItems = [
  { label: 'Available (Click to hold)', className: 'slot-available' },
  { label: 'Your Hold', className: 'slot-my-hold' },
  { label: 'Held by Other', className: 'slot-locked' },
  { label: 'Booked (Click to view players)', className: 'slot-booked' },
  { label: 'Your Booking', className: 'slot-my-booking' },
]

export function SlotGrid({ tableId, date }: SlotGridProps) {
  const router = useRouter()
  const { slots, loading, error, fetchSlots, acquireLock, releaseLock, confirmBooking } =
    useSlotGrid({ tableId, date })
  const [selectedSlot, setSelectedSlot] = useState<SlotWithStatus | null>(null)
  const [viewingSlot, setViewingSlot] = useState<SlotWithStatus | null>(null)
  const [lockLoading, setLockLoading] = useState(false)
  const [lockExpiresAt, setLockExpiresAt] = useState<number | undefined>()
  const [lockError, setLockError] = useState<string | null>(null)

  // Filter out expired / past slots completely
  const activeSlots = slots.filter((slot) => {
    return slot.status !== 'PAST' && !isPastSlot(date, slot.endTime)
  })

  const handleSlotClick = async (slot: SlotWithStatus) => {
    if (slot.status === 'MY_BOOKING') {
      router.push(`/booking/${slot.bookingId}`)
      return
    }

    if (slot.status === 'BOOKED') {
      setViewingSlot(slot)
      return
    }

    if (slot.status === 'MY_HOLD') {
      setSelectedSlot(slot)
      setLockExpiresAt(slot.lockExpiresAt)
      return
    }

    // Acquire lock
    setLockLoading(true)
    setLockError(null)
    const result = await acquireLock(slot.id)
    setLockLoading(false)

    if (result.held) {
      setSelectedSlot({ ...slot, status: 'MY_HOLD', lockExpiresAt: result.expiresAt })
      setLockExpiresAt(result.expiresAt)
    } else {
      setLockError(result.error ?? 'Slot is no longer available')
    }
  }

  const handleModalClose = async () => {
    if (selectedSlot) {
      await releaseLock(selectedSlot.id)
    }
    setSelectedSlot(null)
    setLockExpiresAt(undefined)
  }

  const handleConfirm = async (notes?: string) => {
    if (!selectedSlot) return
    const booking = await confirmBooking(selectedSlot.id, notes)
    setSelectedSlot(null)
    return booking
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading time slots...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={fetchSlots} className="text-xs text-primary hover:underline font-semibold">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Legend & Refresh */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          {legendItems.map(({ label, className }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn('h-3 w-3 rounded-sm border shrink-0', className)} />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={fetchSlots}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Lock error toast */}
      {lockError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {lockError}
        </div>
      )}

      {/* Lock acquiring overlay */}
      {lockLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary animate-pulse">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Securing your slot...
        </div>
      )}

      {/* Slot grid */}
      {activeSlots.length > 0 && (
        <div
          className={cn(
            'grid gap-3',
            'grid-cols-2',
            'sm:grid-cols-3',
            'md:grid-cols-4',
            'lg:grid-cols-5',
            'xl:grid-cols-6'
          )}
        >
          {activeSlots.map((slot) => (
            <SlotCell
              key={slot.id}
              slot={slot}
              date={date}
              onClick={handleSlotClick}
              disabled={lockLoading}
            />
          ))}
        </div>
      )}

      {/* Empty state when all slots have expired or no slots remain */}
      {activeSlots.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground border border-white/10 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">No active upcoming slots available for this date</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              All time slots for today have already passed or are fully booked. Select another upcoming weekday from the calendar above!
            </p>
          </div>
        </div>
      )}

      {/* Booking confirmation modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          date={date}
          lockExpiresAt={lockExpiresAt}
          onConfirm={handleConfirm}
          onClose={handleModalClose}
        />
      )}

      {/* Viewing booked slot details modal (who is playing) */}
      {viewingSlot && (
        <SlotViewModal
          slot={viewingSlot}
          date={date}
          onClose={() => setViewingSlot(null)}
        />
      )}
    </div>
  )
}
