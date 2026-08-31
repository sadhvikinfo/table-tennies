'use client'

import QRCode from 'react-qr-code'

interface BookingPassProps {
  qrToken: string
  bookingId: string
}

export function BookingPass({ qrToken, bookingId }: BookingPassProps) {
  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/checkin?token=${qrToken}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <QRCode
          value={qrValue}
          size={160}
          bgColor="#ffffff"
          fgColor="#1a1a2e"
          level="M"
        />
      </div>
      <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
        {bookingId.slice(0, 8).toUpperCase()}
      </p>
    </div>
  )
}
