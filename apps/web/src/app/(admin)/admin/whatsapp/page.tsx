'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Save, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminWhatsAppPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({
    metaWhatsappToken: '',
    metaWhatsappPhoneId: '',
    metaWhatsappWabaId: '',
  })

  useEffect(() => {
    async function loadWhatsapp() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          setConfig((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Failed to load WhatsApp settings.')
      } finally {
        setLoading(false)
      }
    }
    loadWhatsapp()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'infrastructure'), { ...config, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('💬 Meta WhatsApp Cloud API credentials saved to Firestore!')
    } catch {
      toast.error('Failed to save credentials.')
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
          WhatsApp Cloud API (Meta Business)
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide WhatsApp delivery gateway for automated pastor follow-ups, visitor messages, and devotional broadcasts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            Meta Business API Credentials
          </h2>

          <div className="space-y-3">
            <div>
              <label className="font-semibold">Permanent Access Token</label>
              <input
                type="password"
                placeholder="EAA..."
                value={config.metaWhatsappToken}
                onChange={(e) => setConfig({ ...config, metaWhatsappToken: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Phone Number ID</label>
                <input
                  type="text"
                  placeholder="10987654321"
                  value={config.metaWhatsappPhoneId}
                  onChange={(e) => setConfig({ ...config, metaWhatsappPhoneId: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={config.metaWhatsappWabaId}
                  onChange={(e) => setConfig({ ...config, metaWhatsappWabaId: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
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
              Save WhatsApp Keys
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
