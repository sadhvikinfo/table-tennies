'use client'

import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  selectedDate: string // "yyyy-MM-dd"
  onChange: (date: string) => void
}

export function DatePicker({ selectedDate, onChange }: DatePickerProps) {
  const today = startOfDay(new Date())
  const selected = new Date(selectedDate + 'T00:00:00')

  // Show 7 days from today
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  const goToPrev = () => {
    const prev = addDays(selected, -1)
    if (!isBefore(prev, today)) {
      onChange(format(prev, 'yyyy-MM-dd'))
    }
  }

  const goToNext = () => {
    const next = addDays(selected, 1)
    const maxDate = addDays(today, 6)
    if (!isBefore(maxDate, next)) {
      onChange(format(next, 'yyyy-MM-dd'))
    }
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {formatDate(selected, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={goToPrev}
            disabled={isBefore(selected, addDays(today, 1))}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={format(selected, 'yyyy-MM-dd') === format(addDays(today, 6), 'yyyy-MM-dd')}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day buttons */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === format(today, 'yyyy-MM-dd')

          return (
            <button
              key={dateStr}
              onClick={() => onChange(dateStr)}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 transition-all duration-200',
                isSelected
                  ? 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg'
                  : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {format(day, 'EEE')}
              </span>
              <span className={cn('text-sm font-bold', isToday && !isSelected && 'text-primary')}>
                {format(day, 'd')}
              </span>
              {isToday && !isSelected && (
                <div className="h-1 w-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
