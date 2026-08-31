'use client'

import { useState, useEffect } from 'react'

export function useCountdown(expiresAt?: number) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  })

  useEffect(() => {
    if (!expiresAt) {
      return
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setSecondsLeft(diff)
    }

    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { secondsLeft, formatted, expired: secondsLeft === 0 }
}
