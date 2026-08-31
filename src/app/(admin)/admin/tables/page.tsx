'use client'

import { useState, useEffect } from 'react'
import { Zap, Settings2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Table {
  id: string
  name: string
  locationDescription?: string | null
  isActive: boolean
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/tables')
      .then((r) => r.json())
      .then((d) => { setTables(d.tables ?? []); setLoading(false) })
  }, [])

  const toggleTable = async (table: Table) => {
    setToggling(table.id)
    const res = await fetch(`/api/admin/tables/${table.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !table.isActive }),
    })
    const data = await res.json()
    setTables((prev) => prev.map((t) => (t.id === table.id ? data.table : t)))
    setToggling(null)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Table <span className="text-gradient">Management</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable tables for player bookings.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.id} className="glass rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
                  table.isActive
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                )}>
                  <Zap className={cn(
                    'h-5 w-5',
                    table.isActive ? 'text-green-400' : 'text-red-400'
                  )} />
                </div>
                <div>
                  <p className="font-semibold">{table.name}</p>
                  {table.locationDescription && (
                    <p className="text-xs text-muted-foreground">{table.locationDescription}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                  table.isActive
                    ? 'text-green-400 bg-green-400/10 border-green-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                )}>
                  {table.isActive ? 'Active' : 'Inactive'}
                </span>

                <button
                  onClick={() => toggleTable(table)}
                  disabled={toggling === table.id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    table.isActive
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                  )}
                >
                  {toggling === table.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : table.isActive ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  {table.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
