'use client'

import { useState, useEffect } from 'react'
import { Flag, Save, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminFeatureFlagsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState({
    aiStudio: true,
    automationEngine: true,
    whatsappBroadcasting: true,
    smsBroadcasting: true,
    liveServiceAutomations: true,
    financialGiving: true,
    partnershipsModule: true,
  })

  useEffect(() => {
    async function loadFlags() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'featureFlags')).catch(() => null)
        if (snap && snap.exists()) {
          setFlags((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Could not load feature flags.')
      } finally {
        setLoading(false)
      }
    }
    loadFlags()
  }, [])

  const handleToggle = async (key: string) => {
    const updated = { ...flags, [key]: !(flags as any)[key] }
    setFlags(updated)
    try {
      await setDoc(doc(db, 'system', 'featureFlags'), { ...updated, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('Feature flags updated in Firestore!')
    } catch {
      toast.error('Failed to update feature flags.')
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
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Global Feature Flags &amp; Toggles
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Instantly enable or disable major platform modules system-wide without deploying code.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Flag className="h-4 w-4 text-brand-500" />
          Module Toggles
        </h2>

        <div className="space-y-3">
          {[
            { key: 'aiStudio', label: 'AI Studio Module', desc: 'AI content generation tools' },
            { key: 'automationEngine', label: 'Autonomous Workflow Engine', desc: 'Background execution of visitor journeys' },
            { key: 'whatsappBroadcasting', label: 'WhatsApp Meta Gateway', desc: 'WhatsApp broadcast message processing' },
            { key: 'smsBroadcasting', label: 'Termii SMS Gateway', desc: 'SMS broadcast processing' },
            { key: 'liveServiceAutomations', label: 'Live Service Module', desc: 'Automated stream tracking and chat engagement' },
            { key: 'financialGiving', label: 'Donations & Tithes Module', desc: 'Financial tracking and campaign management' },
            { key: 'partnershipsModule', label: 'Kingdom Partnerships', desc: 'Covenant partner portal' },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between rounded-xl border p-4 bg-muted/10">
              <div>
                <p className="font-bold text-foreground">{f.label}</p>
                <p className="text-muted-foreground text-[11px]">{f.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(f.key)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold ${
                  (flags as any)[f.key] ? 'bg-brand-600 text-white' : 'border bg-background text-muted-foreground'
                }`}
              >
                {(flags as any)[f.key] ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
