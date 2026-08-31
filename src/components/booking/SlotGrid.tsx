'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlotCell } from './SlotCell'
import { BookingModal } from './BookingModal'
import { SlotViewModal } from './SlotViewModal'
import { useSlotGrid } from '@/hooks/useSlotGrid'
import type { SlotWithStatus } from '@/types'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlotGridProps {
  tableId: string
  date: string
}

const legendItems = [
  { label: 'Available', className: 'slot-available' },
  { label: 'Your Hold', className: 'slot-my-hold' },
  { label: 'Held by Other', className: 'slot-locked' },
  { label: 'Booked (Click to view)', className: 'slot-booked' },
  { label: 'Your Booking', className: 'slot-my-booking' },
  { label: 'Expired', className: 'bg-white/10 border-white/10 opacity-50' },
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

  const handleSlotClick = async (slot: SlotWithStatus) => {
    if (slot.status === 'MY_BOOKING') {
      // Navigate to booking detail using router
      router.push(`/booking/${slot.bookingId}`)
      return
    }

    if (slot.status === 'BOOKED') {
      // Show details modal (who is playing)
      setViewingSlot(slot)
      return
    }

    if (slot.status === 'MY_HOLD') {
      // Already holding — open modal directly
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
        <p className="text-sm text-muted-foreground">Loading time slots...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={fetchSlots} className="text-xs text-primary hover:underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {legendItems.map(({ label, className }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm border', className)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <button
          onClick={fetchSlots}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Lock error toast */}
      {lockError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {lockError}
        </div>
      )}

      {/* Lock acquiring overlay */}
      {lockLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Securing your slot...
        </div>
      )}

      {/* Slot grid — responsive: 2 cols mobile → 4 cols tablet+ */}
      <div
        className={cn(
          'grid gap-2',
          'grid-cols-2',
          'sm:grid-cols-3',
          'md:grid-cols-4',
          'lg:grid-cols-5',
          'xl:grid-cols-6'
        )}
      >
        {slots.map((slot) => (
          <SlotCell
            key={slot.id}
            slot={slot}
            date={date}
            onClick={handleSlotClick}
            disabled={lockLoading}
          />
        ))}
      </div>

      {slots.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No slots available for this date.
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
