'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function AdminSystemSettingsPage() {
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Church Growth OS is currently undergoing scheduled maintenance. We\'ll be back shortly.'
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'system', 'maintenance'))
      if (snap.exists()) {
        const data = snap.data()
        setMaintenance(data.active ?? false)
        setMaintenanceMessage(data.message ?? maintenanceMessage)
      }
    } catch (err: any) {
      toast.error('Could not load system settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'maintenance'), {
        active: maintenance,
        message: maintenanceMessage.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      toast.success(
        maintenance
          ? '🚧 Maintenance Mode ACTIVATED — Church users will see the maintenance page.'
          : '✅ Maintenance Mode DEACTIVATED — Platform is live for all users.'
      )
    } catch (err: any) {
      toast.error('Failed to update system settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
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

      <form onSubmit={handleSave} className="space-y-6 max-w-xl text-xs">
        {/* Maintenance Mode */}
        <div className={`rounded-2xl border p-6 shadow-xs space-y-4 ${
          maintenance
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-border bg-card'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                maintenance ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
              }`}>
                {maintenance ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-bold text-foreground">Maintenance Mode</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  When active, church admin users see a maintenance page. Super Admins retain full access.
                </p>
                {maintenance && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                    <ShieldAlert className="h-3 w-3" />
                    MAINTENANCE ACTIVE
                  </div>
                )}
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted outline-none transition-all peer-checked:bg-amber-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Maintenance Message */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Maintenance Message</label>
            <textarea
              rows={3}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Message to show church users during maintenance..."
            />
            <p className="text-[10px] text-muted-foreground">
              This message appears on the maintenance page visible to Church Admin users.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-5 font-semibold text-white disabled:opacity-50 ${
              maintenance ? 'bg-amber-600 hover:bg-amber-500' : 'bg-brand-600 hover:bg-brand-500'
            }`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {maintenance ? 'Activate Maintenance Mode' : 'Save System Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
