'use client'

import { cn, formatTime, isPastSlot } from '@/lib/utils'
import type { SlotWithStatus } from '@/types'
import { Lock, CheckCircle, Clock, Users } from 'lucide-react'

interface SlotCellProps {
  slot: SlotWithStatus
  date: string
  onClick: (slot: SlotWithStatus) => void
  disabled?: boolean
}

const stateConfig = {
  AVAILABLE: {
    className: 'slot-available cursor-pointer hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-cyan-500/10',
    icon: null,
    label: 'Available',
  },
  LOCKED: {
    className: 'slot-locked cursor-not-allowed pulse-border',
    icon: Lock,
    label: 'Held',
  },
  BOOKED: {
    className: 'slot-booked cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all hover:scale-[1.02]',
    icon: Users,
    label: 'Booked',
  },
  MY_BOOKING: {
    className: 'slot-my-booking cursor-pointer ring-2 ring-cyan-500/40 hover:scale-[1.03] shadow-lg shadow-cyan-500/20',
    icon: CheckCircle,
    label: 'My Booking',
  },
  MY_HOLD: {
    className: 'slot-my-hold cursor-pointer pulse-border ring-2 ring-violet-500/40 scale-[1.02]',
    icon: Clock,
    label: 'Holding',
  },
  PAST: {
    className: 'hidden',
    icon: Clock,
    label: 'Expired',
  },
}

export function SlotCell({ slot, date, onClick, disabled }: SlotCellProps) {
  const isPast = slot.status === 'PAST' || isPastSlot(date, slot.endTime)

  // Completely skip rendering past / expired slots
  if (isPast) return null

  const config = stateConfig[slot.status as keyof typeof stateConfig] ?? stateConfig.AVAILABLE
  const Icon = config.icon

  const isBooked = slot.status === 'BOOKED' || slot.status === 'MY_BOOKING'

  const handleClick = () => {
    if (disabled || slot.status === 'LOCKED') return
    onClick(slot)
  }

  // Format player names for cell preview
  const rawPlayerNames = slot.notes
    ? slot.notes.replace('Players: ', '').split(' | Notes: ')[0]
    : slot.bookedByName

  return (
    <button
      onClick={handleClick}
      disabled={disabled || slot.status === 'LOCKED'}
      aria-label={`Slot ${slot.startTime}–${slot.endTime}: ${config.label}`}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-2xl border p-3 transition-all duration-300 select-none group min-h-[90px] w-full',
        config.className,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Time header */}
      <div className="flex flex-col items-center w-full">
        <span className="text-xs sm:text-sm font-extrabold tabular-nums leading-tight tracking-tight">
          {formatTime(slot.startTime)}
        </span>
        <span className="text-[10px] opacity-70 leading-tight font-medium">
          to {formatTime(slot.endTime)}
        </span>
      </div>

      {/* Content area: Player Names or Status Badge */}
      {isBooked && rawPlayerNames ? (
        <div className="mt-1.5 flex flex-col items-center w-full px-1 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-1 max-w-full">
            <Users className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="text-[10px] font-bold text-cyan-300 truncate text-center leading-tight">
              {rawPlayerNames}
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-wider text-cyan-400/80 font-bold mt-0.5">
            {slot.status === 'MY_BOOKING' ? 'Your Booking' : 'Booked'}
          </span>
        </div>
      ) : (
        <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
          {Icon && <Icon className="h-3 w-3 text-primary" />}
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">
            {config.label}
          </span>
        </div>
      )}

      {/* Hover glow shimmer for available slots */}
      {slot.status === 'AVAILABLE' && (
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
      )}
    </button>
  )
}
