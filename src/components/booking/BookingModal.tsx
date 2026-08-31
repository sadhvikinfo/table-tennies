'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCountdown } from '@/hooks/useCountdown'
import type { SlotWithStatus } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import { parseISO } from 'date-fns'
import { Clock, AlertTriangle, CheckCircle, X, Loader2, Zap, Users, Plus, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface BookingModalProps {
  slot: SlotWithStatus
  date: string
  lockExpiresAt?: number
  onConfirm: (notes?: string) => Promise<unknown>
  onClose: () => void
}

export function BookingModal({ slot, date, lockExpiresAt, onConfirm, onClose }: BookingModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [players, setPlayers] = useState<string[]>(() => [session?.user?.name || ''])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { formatted, secondsLeft } = useCountdown(lockExpiresAt)

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, ''])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, value: string) => {
    const updated = [...players]
    updated[index] = value
    setPlayers(updated)
  }

  const handleConfirm = async () => {
    const validPlayers = players.map((p) => p.trim()).filter(Boolean)
    if (validPlayers.length === 0) {
      setError('Please enter at least 1 player name.')
      return
    }

    setLoading(true)
    setError(null)

    const playerSummary = `Players: ${validPlayers.join(', ')}`
    const fullNotes = notes.trim() ? `${playerSummary} | Notes: ${notes.trim()}` : playerSummary

    try {
      await onConfirm(fullNotes)
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = secondsLeft === 0 && !!lockExpiresAt

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
              <h2 className="text-base font-semibold text-foreground">Confirm Booking</h2>
              <p className="text-xs text-muted-foreground">Table Tennis — Office</p>
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
          {/* Slot details */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">{formatDate(parseISO(date))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-medium">30 minutes</span>
            </div>
          </div>

          {/* Lock timer */}
          {lockExpiresAt && !success && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs',
              isExpired
                ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                : secondsLeft < 60
                ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
            )}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {isExpired
                ? 'Your hold expired. Please select the slot again.'
                : `Slot held for ${formatted} — confirm before it expires!`}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2.5 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              Booking confirmed! Redirecting to your dashboard...
            </div>
          )}

          {/* Player Names Input (Min 1, Max 4) */}
          {!success && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Player Names <span className="text-muted-foreground font-normal">({players.length}/4, min 1)</span>
                </label>
                {players.length < 4 && (
                  <button
                    type="button"
                    onClick={addPlayer}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Player
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                {players.map((player, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => updatePlayer(idx, e.target.value)}
                      required
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(idx)}
                        title="Remove player"
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Notes */}
          {!success && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 p-5 border-t border-white/10">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || isExpired}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
