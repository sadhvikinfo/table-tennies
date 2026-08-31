'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2, Save, CheckCircle } from 'lucide-react'

interface Settings {
  openTime: string
  closeTime: string
  slotDurationMin: number
  maxBookingsPerUserPerDay: number
  allowCancellationUntilMinsBefore: number
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings); setLoading(false) })
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const fields = [
    { key: 'openTime', label: 'Opening Time', type: 'time', help: 'Venue opens at this time' },
    { key: 'closeTime', label: 'Closing Time', type: 'time', help: 'Last slot ends by this time' },
    { key: 'slotDurationMin', label: 'Slot Duration (minutes)', type: 'number', help: 'Duration of each bookable slot' },
    { key: 'maxBookingsPerUserPerDay', label: 'Max Bookings per Player per Day', type: 'number', help: 'Limit to ensure fairness' },
    { key: 'allowCancellationUntilMinsBefore', label: 'Cancellation Window (minutes before slot)', type: 'number', help: 'Players cannot cancel within this window' },
  ] as const

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Venue <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure operating hours and booking rules.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {fields.map(({ key, label, type, help }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <input
              type={type}
              value={settings[key]}
              onChange={(e) =>
                setSettings((s) => s ? {
                  ...s,
                  [key]: type === 'number' ? parseInt(e.target.value) : e.target.value,
                } : s)
              }
              min={type === 'number' ? 1 : undefined}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="text-xs text-muted-foreground">{help}</p>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  )
}
