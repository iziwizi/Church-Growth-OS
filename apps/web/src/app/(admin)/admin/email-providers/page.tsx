'use client'

import { useState, useEffect } from 'react'
import { Mail, Save, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminEmailProvidersPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({
    resendKey: '',
    fromEmail: 'noreply@churchgrowthos.com',
    fromName: 'Church Growth OS',
  })

  useEffect(() => {
    async function loadEmailConfig() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          setConfig((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Failed to load email settings.')
      } finally {
        setLoading(false)
      }
    }
    loadEmailConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'infrastructure'), { ...config, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('✉️ Resend Email Gateway credentials saved to Firestore!')
    } catch {
      toast.error('Failed to save email settings.')
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
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Resend Email Delivery Gateway
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide email gateway configuration for transactional emails, reports, and onboarding verification.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-500" />
            Resend Credentials
          </h2>

          <div className="space-y-3">
            <div>
              <label className="font-semibold">Resend API Key</label>
              <input
                type="password"
                placeholder="re_..."
                value={config.resendKey}
                onChange={(e) => setConfig({ ...config, resendKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Default Sender Email</label>
                <input
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-semibold">Default Sender Name</label>
                <input
                  type="text"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Email Credentials
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
