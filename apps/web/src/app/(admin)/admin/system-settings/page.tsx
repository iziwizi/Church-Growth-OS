'use client'

import { useState } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSystemSettingsPage() {
  const [maintenance, setMaintenance] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('System settings updated!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Global System Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide flags, maintenance mode, and global quotas for MUJTEKNIFY LIMITED.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 max-w-xl text-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">Maintenance Mode</p>
            <p className="text-muted-foreground text-[11px]">Displays maintenance banner across church dashboards</p>
          </div>
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="h-4 w-4 rounded"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  )
}
