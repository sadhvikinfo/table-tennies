'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SlotWithStatus } from '@/types'

interface UseSlotGridOptions {
  tableId: string
  date: string
}

export function useSlotGrid({ tableId, date }: UseSlotGridOptions) {
  const [slots, setSlots] = useState<SlotWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!tableId || !date) return
    try {
      const res = await fetch(`/api/slots?tableId=${tableId}&date=${date}`)
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data = await res.json()
      setSlots(data.slots)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [tableId, date])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!tableId || !date) return
      try {
        const res = await fetch(`/api/slots?tableId=${tableId}&date=${date}`)
        if (!res.ok) throw new Error('Failed to fetch slots')
        const data = await res.json()
        if (!ignore) {
          setSlots(data.slots)
          setError(null)
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : 'Unknown error')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()

    pollRef.current = setInterval(fetchSlots, 10000)
    return () => {
      ignore = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [tableId, date, fetchSlots])

  const acquireLock = useCallback(
    async (slotId: string): Promise<{ held: boolean; expiresAt?: number; error?: string }> => {
      const res = await fetch('/api/slots/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, slotId, date }),
      })
      const data = await res.json()
      if (res.ok && data.held) {
        // Optimistically update slot state
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? { ...s, status: 'MY_HOLD', lockedByMe: true, lockExpiresAt: data.expiresAt }
              : s
          )
        )
        return { held: true, expiresAt: data.expiresAt }
      }
      return { held: false, error: data.reason ?? data.error }
    },
    [tableId, date]
  )

  const releaseLock = useCallback(
    async (slotId: string) => {
      await fetch('/api/slots/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, slotId, date }),
      })
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, status: 'AVAILABLE', lockedByMe: false, lockExpiresAt: undefined } : s
        )
      )
    },
    [tableId, date]
  )

  const confirmBooking = useCallback(
    async (slotId: string, notes?: string) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, slotId, date, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      await fetchSlots() // Refresh grid
      return data.booking
    },
    [tableId, date, fetchSlots]
  )

  return { slots, loading, error, fetchSlots, acquireLock, releaseLock, confirmBooking }
}
