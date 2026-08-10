'use client'

import { useState, useEffect } from 'react'
import { Cloud, Save, Loader2, CheckCircle2, AlertTriangle, TestTube, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

interface CloudinaryUsage {
  plan: string
  credits: { used: number; limit: number }
  storage: { usedGb: string; limitGb: string }
  bandwidth: { usedGb: string; limitGb: string }
  resources: number
  transformations: number
}

export default function AdminCloudinaryPage() {
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; usage?: CloudinaryUsage } | null>(null)

  const [config, setConfig] = useState({
    cloudName: '',
    apiKey: '',
    apiSecret: '', // Only used for form input — never stored client-side after save
    hasSecret: false,
    maskedApiKey: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      // Load via server-side route — never exposes the secret
      const res = await adminFetch('/api/admin/cloudinary/save')
      const data = await res.json()
      if (data.success && data.config) {
        setConfig(prev => ({
          ...prev,
          cloudName: data.config.cloudName ?? '',
          maskedApiKey: data.config.apiKey ?? '',
          hasSecret: data.config.hasSecret ?? false,
        }))
      }
    } catch (err: any) {
      toast.error('Failed to load Cloudinary settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.cloudName.trim() || !config.apiKey.trim()) {
      toast.error('Cloud Name and API Key are required.')
      return
    }

    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/cloudinary/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudName: config.cloudName.trim(),
          apiKey: config.apiKey.trim(),
          apiSecret: config.apiSecret.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('☁️ Cloudinary credentials saved securely!')
        // Clear the secret from the form after saving
        setConfig(prev => ({ ...prev, apiSecret: '', hasSecret: true }))
        await loadConfig()
      } else {
        toast.error(data.error ?? 'Failed to save Cloudinary credentials.')
      }
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await adminFetch('/api/admin/cloudinary/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ ok: true, message: data.message, usage: data.usage })
        toast.success('✅ Cloudinary connection verified!')
      } else {
        setTestResult({ ok: false, message: data.error ?? 'Test failed.' })
        toast.error(data.error ?? 'Cloudinary test failed.')
      }
    } catch (err: any) {
      const msg = err.message ?? 'Test request failed.'
      setTestResult({ ok: false, message: msg })
      toast.error(msg)
    } finally {
      setTesting(false)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cloudinary Storage &amp; Media Delivery
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Global media bucket configuration for church logos, member photos, sermon audio, and video uploads.
          </p>
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
          Test Connection
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-xl border p-4 text-xs font-medium space-y-3 ${
          testResult.ok
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-700'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.ok
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>

          {testResult.usage && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20 sm:grid-cols-4">
              <div className="rounded-xl bg-white/50 p-2.5 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Plan</p>
                <p className="font-bold text-foreground capitalize">{testResult.usage.plan}</p>
              </div>
              <div className="rounded-xl bg-white/50 p-2.5 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Storage Used</p>
                <p className="font-bold text-foreground">{testResult.usage.storage.usedGb} GB</p>
              </div>
              <div className="rounded-xl bg-white/50 p-2.5 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Bandwidth Used</p>
                <p className="font-bold text-foreground">{testResult.usage.bandwidth.usedGb} GB</p>
              </div>
              <div className="rounded-xl bg-white/50 p-2.5 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Total Assets</p>
                <p className="font-bold text-foreground">{testResult.usage.resources.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              Cloudinary API Credentials
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
              🔒 Stored Server-Side Only
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[10px] text-blue-700">
            ℹ️ Credentials are saved securely via server-side API. The API Secret is never returned to the browser after saving.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-semibold">Cloud Name</label>
              <input
                type="text"
                value={config.cloudName}
                onChange={(e) => setConfig({ ...config, cloudName: e.target.value })}
                placeholder="e.g. de5bd8h8p"
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                required
              />
            </div>
            <div>
              <label className="font-semibold">API Key</label>
              <input
                type="text"
                value={config.apiKey || config.maskedApiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={config.maskedApiKey || 'Enter API Key'}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                required
              />
            </div>
            <div>
              <label className="font-semibold">API Secret</label>
              <input
                type="password"
                value={config.apiSecret}
                onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                placeholder={config.hasSecret ? '•••••• (saved — re-enter to update)' : 'Enter API Secret'}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
              {config.hasSecret && !config.apiSecret && (
                <p className="mt-1 text-[10px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Secret is saved securely on the server.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Cloudinary Credentials
          </button>
        </div>
      </form>
    </div>
  )
}
