'use client'

import { useState } from 'react'
import { QrCode, Search, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { parseISO } from 'date-fns'

interface BookingResult {
  id: string
  status: string
  bookingDate: string
  user: { name: string; email: string; phone?: string | null }
  table: { name: string }
  slot: { startTime: string; endTime: string }
}

export default function AdminCheckinPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ valid: boolean; booking?: BookingResult; error?: string } | null>(null)

  const handleLookup = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)

    // Detect if it's a booking ID (cuid format) or a QR token
    const body = input.length > 20 && !input.includes('/')
      ? { bookingId: input.trim() }
      : { qrToken: input.split('token=').pop() }

    const res = await fetch('/api/admin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          QR <span className="text-gradient">Check-In</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Look up a booking by QR token or booking ID.
        </p>
      </div>

      {/* Lookup input */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Manual Lookup</h2>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Paste booking ID or QR URL..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={handleLookup}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Scan the QR code with your phone camera to get the booking URL, then paste it above.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-6 space-y-4 ${
          result.valid
            ? 'bg-green-500/5 border-green-500/30'
            : 'bg-red-500/5 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {result.valid ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <span className={`font-semibold text-sm ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
              {result.valid ? 'Valid Booking — Check-In Approved' : `Invalid — ${result.error}`}
            </span>
          </div>

          {result.booking && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <Row label="Player" value={result.booking.user.name} />
              <Row label="Email" value={result.booking.user.email} />
              {result.booking.user.phone && <Row label="Phone" value={result.booking.user.phone} />}
              <Row label="Table" value={result.booking.table.name} />
              <Row label="Date" value={formatDate(parseISO(result.booking.bookingDate.split('T')[0]))} />
              <Row
                label="Time"
                value={`${formatTime(result.booking.slot.startTime)} – ${formatTime(result.booking.slot.endTime)}`}
              />
              <Row label="Status" value={result.booking.status} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
