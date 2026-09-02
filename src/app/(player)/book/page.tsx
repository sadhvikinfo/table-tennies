'use client'

import { useState, useEffect } from 'react'
import { format, isWeekend, addDays } from 'date-fns'
import { DatePicker } from '@/components/booking/DatePicker'
import { SlotGrid } from '@/components/booking/SlotGrid'
import { Zap } from 'lucide-react'

function getInitialWeekday(): string {
  let d = new Date()
  while (isWeekend(d)) {
    d = addDays(d, 1)
  }
  return format(d, 'yyyy-MM-dd')
}

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getInitialWeekday)
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Book a <span className="text-gradient">Slot</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select an upcoming weekday and reserve your office table tennis time slot.
            </p>
          </div>
        </div>
      </div>

      {/* Date picker */}
      <DatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* Slot grid */}
      {tableId ? (
        <div className="glass rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl">
          <SlotGrid tableId={tableId} date={selectedDate} />
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground space-y-2">
          <p className="text-base font-semibold text-foreground">No active tables available</p>
          <p className="text-xs text-muted-foreground">Please contact the administrator to enable recreation tables.</p>
        </div>
      )}
    </div>
  )
}
