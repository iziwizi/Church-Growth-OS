'use client'

import { useState, useEffect } from 'react'
import { Cloud, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminCloudinaryPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({
    cloudinaryCloudName: 'de5bd8h8p',
    cloudinaryApiKey: '295731483436216',
    cloudinaryApiSecret: '',
  })

  useEffect(() => {
    async function loadCloudinary() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          setConfig((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Failed to load Cloudinary settings.')
      } finally {
        setLoading(false)
      }
    }
    loadCloudinary()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'infrastructure'), { ...config, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('☁️ Cloudinary Storage Credentials saved to Firestore!')
    } catch {
      toast.error('Failed to save settings.')
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
          Cloudinary Storage &amp; Media Delivery
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Global media bucket configuration for church logos, member profile photos, sermon audio, and video uploads.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            Media Storage Bucket Credentials
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-semibold">Cloud Name</label>
              <input
                type="text"
                value={config.cloudinaryCloudName}
                onChange={(e) => setConfig({ ...config, cloudinaryCloudName: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">API Key</label>
              <input
                type="text"
                value={config.cloudinaryApiKey}
                onChange={(e) => setConfig({ ...config, cloudinaryApiKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">API Secret</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={config.cloudinaryApiSecret}
                onChange={(e) => setConfig({ ...config, cloudinaryApiSecret: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Storage Keys
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
