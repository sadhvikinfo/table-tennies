'use client'

import { format, addDays, startOfDay, isWeekend } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface DatePickerProps {
  selectedDate: string // "yyyy-MM-dd"
  onChange: (date: string) => void
}

export function DatePicker({ selectedDate, onChange }: DatePickerProps) {
  const today = startOfDay(new Date())
  const selected = new Date(selectedDate + 'T00:00:00')

  // Generate the next 10 weekday dates (Mon–Fri only, skipping Sat & Sun)
  const weekdays: Date[] = []
  let curr = new Date(today)

  while (weekdays.length < 10) {
    if (!isWeekend(curr)) {
      weekdays.push(new Date(curr))
    }
    curr = addDays(curr, 1)
  }

  // Find index of selected date
  const selectedIndex = weekdays.findIndex(
    (d) => format(d, 'yyyy-MM-dd') === selectedDate
  )

  const goToPrev = () => {
    if (selectedIndex > 0) {
      onChange(format(weekdays[selectedIndex - 1], 'yyyy-MM-dd'))
    }
  }

  const goToNext = () => {
    if (selectedIndex < weekdays.length - 1) {
      onChange(format(weekdays[selectedIndex + 1], 'yyyy-MM-dd'))
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              {formatDate(selected, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Office Slot Booking</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">Mon – Fri Only</span>
            </p>
          </div>
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={goToPrev}
            disabled={selectedIndex <= 0}
            title="Previous Weekday"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={selectedIndex >= weekdays.length - 1 || selectedIndex === -1}
            title="Next Weekday"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Tab List (Only Mon–Fri) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {weekdays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === format(today, 'yyyy-MM-dd')

          return (
            <button
              key={dateStr}
              onClick={() => onChange(dateStr)}
              className={cn(
                'flex-1 min-w-[72px] sm:min-w-[84px] flex flex-col items-center justify-center rounded-xl p-2.5 sm:p-3 transition-all duration-300 select-none group border',
                isSelected
                  ? 'bg-gradient-to-br from-cyan-500 to-violet-600 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/25 scale-[1.03]'
                  : 'bg-white/5 border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {format(day, 'EEE')}
              </span>
              <span className="text-base sm:text-lg font-extrabold mt-0.5 leading-tight">
                {format(day, 'd')}
              </span>
              <span className="text-[9px] font-semibold opacity-70 mt-0.5 uppercase tracking-wider">
                {format(day, 'MMM')}
              </span>

              {isToday && (
                <span
                  className={cn(
                    'mt-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded-full',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/20 text-primary border border-primary/30'
                  )}
                >
                  Today
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
