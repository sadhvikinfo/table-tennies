import { BookingStatus, Role } from '@prisma/client'

export type { BookingStatus, Role }

export interface SlotWithStatus {
  id: string
  startTime: string
  endTime: string
  displayOrder: number
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'MY_BOOKING' | 'MY_HOLD'
  lockedByMe?: boolean
  lockExpiresAt?: number // unix timestamp ms
  bookingId?: string
  bookedByName?: string
  notes?: string | null
}

export interface BookingWithDetails {
  id: string
  userId: string
  tableId: string
  slotId: string
  bookingDate: string // ISO date string
  status: BookingStatus
  qrToken: string
  notes?: string | null
  createdAt: string
  user: {
    name: string
    email: string
    phone?: string | null
  }
  table: {
    name: string
    locationDescription?: string | null
  }
  slot: {
    startTime: string
    endTime: string
  }
}

export interface VenueSettingsData {
  id: string
  openTime: string
  closeTime: string
  slotDurationMin: number
  maxBookingsPerUserPerDay: number
  allowCancellationUntilMinsBefore: number
}

export interface SlotEvent {
  type: 'LOCKED' | 'UNLOCKED' | 'BOOKED' | 'CANCELLED'
  tableId: string
  slotId: string
  date: string
  userId?: string
  bookingId?: string
  timestamp: number
}

export interface TableData {
  id: string
  name: string
  locationDescription?: string | null
  isActive: boolean
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
