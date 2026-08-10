'use client'

import { useState, useEffect } from 'react'
import { Flag, Loader2, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

interface FeatureFlagItem {
  key: string
  label: string
  desc: string
  category: string
}

const FEATURE_ITEMS: FeatureFlagItem[] = [
  { key: 'aiStudio', label: 'AI Studio Module', desc: 'AI content generation tools, devotionals, and sermon repurposing', category: 'Artificial Intelligence' },
  { key: 'automationEngine', label: 'Autonomous Workflow Engine', desc: 'Background execution of scheduled visitor follow-up journeys', category: 'Automation' },
  { key: 'whatsappBroadcasting', label: 'WhatsApp Meta Gateway', desc: 'WhatsApp broadcast message processing and church-owned WABA delivery', category: 'Communications' },
  { key: 'smsBroadcasting', label: 'Termii SMS Gateway', desc: 'SMS broadcast processing with custom alphanumeric Sender IDs', category: 'Communications' },
  { key: 'liveServiceAutomations', label: 'Live Service Control Room', desc: 'Live stream preflight checking, RTMP management, and service engagement', category: 'Broadcasting' },
  { key: 'churchStore', label: 'Church Store & Resources', desc: 'Digital books, e-books, sermons, courses, and event ticket sales catalog', category: 'Commerce' },
  { key: 'financialGiving', label: 'Donations & Tithes Module', desc: 'Online contributions, multi-gateway payments, and financial campaign tracking', category: 'Finance' },
  { key: 'dailyExecutiveReport', label: '6:00 AM Executive Daily Report', desc: 'Automated morning executive briefing engine for Senior Pastors', category: 'Intelligence' },
  { key: 'partnershipsModule', label: 'Kingdom Partnerships', desc: 'Covenant partner portal and giving pledge management', category: 'Community' },
  { key: 'advancedAnalytics', label: 'Platform Analytics & Telemetry', desc: 'Deep engagement tracking, attendance forecasting, and cohort retention', category: 'Operations' },
]

export default function AdminFeatureFlagsPage() {
  const [loading, setLoading] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  const loadFlags = async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/feature-flags')
      const data = await res.json()
      if (res.ok && data.success) {
        setFlags(data.flags || {})
      } else {
        toast.error(data.error ?? 'Could not load feature flags.')
      }
    } catch {
      toast.error('Network error loading feature flags.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlags()
  }, [])

  const handleToggle = async (key: string) => {
    if (togglingKey) return // prevent double-clicking
    const previousVal = flags[key] ?? true
    const nextVal = !previousVal

    // 1. Optimistic UI update
    setFlags((prev) => ({ ...prev, [key]: nextVal }))
    setTogglingKey(key)

    try {
      const res = await adminFetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: nextVal }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setFlags(data.flags || { ...flags, [key]: nextVal })
        toast.success(`Feature flag "${key}" updated successfully: ${nextVal ? 'ENABLED' : 'DISABLED'}`)
      } else {
        // Rollback on server error
        setFlags((prev) => ({ ...prev, [key]: previousVal }))
        toast.error(data.error ?? 'Failed to update feature flag.')
      }
    } catch {
      // Rollback on network failure
      setFlags((prev) => ({ ...prev, [key]: previousVal }))
      toast.error('Network error updating feature flag.')
    } finally {
      setTogglingKey(null)
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
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Global Feature Flags &amp; Toggles
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Instantly enable or disable major platform modules system-wide without deploying code.
          </p>
        </div>
        <button
          type="button"
          onClick={loadFlags}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          Refresh Flags
        </button>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Flag className="h-4 w-4 text-brand-600" />
            Module Toggles
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {Object.values(flags).filter(Boolean).length} of {FEATURE_ITEMS.length} Modules Active
          </span>
        </div>

        <div className="space-y-3">
          {FEATURE_ITEMS.map((f) => {
            const isEnabled = flags[f.key] ?? true
            const isBusy = togglingKey === f.key

            return (
              <div
                key={f.key}
                className="flex items-center justify-between rounded-xl border p-4 bg-muted/10 transition-colors hover:bg-muted/20"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-xs">{f.label}</p>
                    <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 uppercase">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{f.desc}</p>
                </div>

                {/* Real Switch / Toggle Control */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase transition-colors ${
                      isEnabled ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    disabled={isBusy}
                    onClick={() => handleToggle(f.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
                      isEnabled ? 'bg-brand-600' : 'bg-muted-foreground/30'
                    }`}
                  >
                    {isBusy ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
