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
    className: 'slot-available cursor-pointer hover:scale-[1.02] active:scale-95',
    icon: null,
    label: 'Available',
  },
  LOCKED: {
    className: 'slot-locked cursor-not-allowed pulse-border',
    icon: Lock,
    label: 'Held',
  },
  BOOKED: {
    className: 'slot-booked cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all',
    icon: Users,
    label: 'Booked',
  },
  MY_BOOKING: {
    className: 'slot-my-booking cursor-pointer ring-2 ring-cyan-500/30 hover:scale-[1.02]',
    icon: CheckCircle,
    label: 'My Booking',
  },
  MY_HOLD: {
    className: 'slot-my-hold cursor-pointer pulse-border ring-2 ring-violet-500/30',
    icon: Clock,
    label: 'Holding',
  },
  PAST: {
    className: 'bg-white/[0.03] border-white/5 text-muted-foreground/40 cursor-not-allowed opacity-40',
    icon: Clock,
    label: 'Expired',
  },
}

export function SlotCell({ slot, date, onClick, disabled }: SlotCellProps) {
  const isPast = slot.status === 'PAST' || isPastSlot(date, slot.endTime)
  const currentStatus = isPast ? 'PAST' : slot.status
  const config = stateConfig[currentStatus as keyof typeof stateConfig] ?? stateConfig.AVAILABLE
  const Icon = config.icon

  const isBooked = (slot.status === 'BOOKED' || slot.status === 'MY_BOOKING') && !isPast

  const handleClick = () => {
    if (disabled || isPast || slot.status === 'LOCKED') return
    onClick(slot)
  }

  // Format player names for cell preview
  const rawPlayerNames = slot.notes
    ? slot.notes.replace('Players: ', '').split(' | Notes: ')[0]
    : slot.bookedByName

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPast || slot.status === 'LOCKED'}
      aria-label={`Slot ${slot.startTime}–${slot.endTime}: ${config.label}`}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all duration-200 select-none group min-h-[82px] w-full',
        config.className,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Time label */}
      <span className="text-xs font-semibold tabular-nums leading-tight">
        {formatTime(slot.startTime)}
      </span>
      <span className="text-[10px] opacity-70 leading-tight">
        {formatTime(slot.endTime)}
      </span>

      {/* Player names or status label */}
      {isBooked && rawPlayerNames ? (
        <div className="mt-1 flex flex-col items-center w-full px-1">
          <span className="text-[10px] font-semibold text-cyan-400 truncate w-full text-center leading-tight">
            {rawPlayerNames}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">
            {slot.status === 'MY_BOOKING' ? 'Your Booking' : 'Booked'}
          </span>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          {Icon && <Icon className="h-3 w-3" />}
          <span className="text-[9px] font-medium uppercase tracking-widest opacity-80">
            {config.label}
          </span>
        </div>
      )}

      {/* Hover shimmer for available slots */}
      {slot.status === 'AVAILABLE' && !isPast && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
    </button>
  )
}
