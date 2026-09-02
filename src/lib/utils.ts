import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, fmt) : ''
}

export function formatTime(time: string): string {
  // Converts "09:00" → "9:00 AM"
  const [hourStr, min] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:${min} ${ampm}`
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isToday(dateStr: string): boolean {
  return dateStr === toISODateString(new Date())
}

export function getTodayDate(): Date {
  return new Date(format(new Date(), 'yyyy-MM-dd'))
}

export function isWeekendDay(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function getNextWeekday(date: Date = new Date()): Date {
  const cur = new Date(date)
  while (isWeekendDay(cur)) {
    cur.setDate(cur.getDate() + 1)
  }
  return cur
}

export function isPastSlot(dateStr: string, endTime: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, min] = endTime.split(':').map(Number)
  const slotEnd = new Date(year, month - 1, day, hour, min, 0)
  return slotEnd.getTime() < Date.now()
}

export function minutesUntilSlot(dateStr: string, startTime: string): number {
  const [hour, min] = startTime.split(':').map(Number)
  const slotStart = parseISO(`${dateStr}T${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`)
  return Math.floor((slotStart.getTime() - Date.now()) / 60000)
}

export function canCancel(dateStr: string, startTime: string, minsBefore = 120): boolean {
  return minutesUntilSlot(dateStr, startTime) > minsBefore
}
