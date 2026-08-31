'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { DatePicker } from '@/components/booking/DatePicker'
import { SlotGrid } from '@/components/booking/SlotGrid'
import { Zap, Info } from 'lucide-react'

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tables')
      .then((r) => r.json())
      .then((data) => {
        const activeTables = (data.tables ?? []).filter((t: { isActive: boolean }) => t.isActive)
        if (activeTables.length > 0) setTableId(activeTables[0].id)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Book a Slot</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          Select a date and time slot for the office table tennis table.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-xs text-primary">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Once you click a slot, you have <strong>5 minutes</strong> to confirm before it&apos;s released. Max 3 bookings per day.
        </span>
      </div>

      {/* Date picker */}
      <DatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* Slot grid */}
      {tableId ? (
        <div className="glass rounded-2xl p-4 sm:p-6">
          <SlotGrid tableId={tableId} date={selectedDate} />
        </div>
      ) : (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          No active tables available. Please contact the admin.
        </div>
      )}
    </div>
  )
}
