'use client'

import type { SlotWithStatus } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import { parseISO } from 'date-fns'
import { X, Users, Clock, Calendar, CheckCircle, Zap } from 'lucide-react'

interface SlotViewModalProps {
  slot: SlotWithStatus
  date: string
  onClose: () => void
}

export function SlotViewModal({ slot, date, onClose }: SlotViewModalProps) {
  const playerNames = slot.notes
    ? slot.notes.replace('Players: ', '').split(' | Notes: ')[0]
    : slot.bookedByName || 'Reserved'

  const extraNotes = slot.notes && slot.notes.includes(' | Notes: ')
    ? slot.notes.split(' | Notes: ')[1]
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Slot Details</h2>
              <p className="text-xs text-cyan-400 font-medium">Booked & Active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Date
              </div>
              <span className="text-sm font-medium">{formatDate(parseISO(date))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Time
              </div>
              <span className="text-sm font-medium">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" /> Status
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Booked
              </span>
            </div>
          </div>

          {/* Players Info */}
          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Users className="h-4 w-4" /> Who is Playing:
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {playerNames}
            </p>
            {slot.bookedByName && slot.bookedByName !== playerNames && (
              <p className="text-xs text-muted-foreground">
                Booked by: <span className="text-foreground">{slot.bookedByName}</span>
              </p>
            )}
            {extraNotes && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-white/10">
                Note: {extraNotes}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
