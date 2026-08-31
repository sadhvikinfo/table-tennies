'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let setToastsExternal: React.Dispatch<React.SetStateAction<Toast[]>> | null = null

export function toast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2)
  const newToast = { id, message, type }
  if (setToastsExternal) {
    setToastsExternal((prev) => [...prev, newToast])
    setTimeout(() => {
      setToastsExternal?.((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    setToastsExternal = setToasts
    return () => { setToastsExternal = null }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'glass rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-lg pointer-events-auto animate-in slide-in-from-right-4 duration-300',
            t.type === 'success' && 'border-green-500/30 text-green-400',
            t.type === 'error' && 'border-red-500/30 text-red-400',
            t.type === 'info' && 'border-primary/30 text-primary'
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
