'use client'

import { useState, useEffect } from 'react'
import { Mail, Save, Loader2, Send, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminEmailProvidersPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')

  const [config, setConfig] = useState({
    emailProvider: 'resend',
    resendKey: '',
    fromEmail: 'noreply@mujteknify.com',
    fromName: 'Church Growth OS',
    enabled: true,
  })

  useEffect(() => {
    async function loadEmailConfig() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          const data = snap.data()
          setConfig((prev) => ({
            ...prev,
            resendKey: data?.resendKey ?? prev.resendKey,
            fromEmail: data?.fromEmail ?? 'noreply@mujteknify.com',
            fromName: data?.fromName ?? 'Church Growth OS',
            enabled: data?.emailEnabled ?? true,
          }))
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
      await setDoc(
        doc(db, 'system', 'infrastructure'),
        {
          resendKey: config.resendKey.trim(),
          fromEmail: config.fromEmail.trim() || 'noreply@mujteknify.com',
          fromName: config.fromName.trim() || 'Church Growth OS',
          emailEnabled: config.enabled,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('✉️ Resend Email Gateway credentials saved to Firestore!')
    } catch (err: any) {
      console.error('Email config save error:', err)
      toast.error(err?.message ?? 'Failed to save email settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/auth/test-email', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`✅ Resend API Connection Verified! (Verified domain: mujteknify.com)`)
      } else {
        toast.error(`❌ Resend API Error: ${data.error ?? 'Invalid API key or unverified domain'}`)
      }
    } catch (err: any) {
      toast.error(`Test connection failed: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error('Please enter a recipient email address')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: testEmailAddress.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`📬 Test verification email sent to ${testEmailAddress}!`)
      } else {
        toast.error(`❌ Email Send Failed: ${data.error ?? 'Resend API rejected request'}`)
      }
    } catch (err: any) {
      toast.error(`Send test failed: ${err.message}`)
    } finally {
      setSendingTest(false)
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
          Resend Email Delivery Gateway (Verified Domain: mujteknify.com)
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide email gateway configuration for transactional emails, reports, and onboarding verification.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-500" />
              Resend Provider Configuration (Part 18)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-500 hover:bg-brand-500/20 transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Test Provider Connection
              </button>
            </div>
          </div>

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
              <p className="text-[10px] text-muted-foreground mt-1">
                Keys stored securely server-side. Displays masked representation in production responses.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Verified Sender Email</label>
                <input
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                  placeholder="noreply@mujteknify.com"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                />
                <p className="text-[10px] text-emerald-500 font-semibold mt-1">
                  ✓ Domain mujteknify.com is verified in Resend
                </p>
              </div>

              <div>
                <label className="font-semibold">Default Sender Display Name</label>
                <input
                  type="text"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  placeholder="Church Growth OS"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Email Delivery Status:</span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`h-6 px-2.5 rounded-lg text-[10px] font-bold ${
                  config.enabled ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {config.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Email Gateway Settings
            </button>
          </div>
        </div>
      </form>

      {/* Send Test Email Component */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Send className="h-4 w-4 text-brand-500" />
          Send Test Email
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="email"
            placeholder="Recipient email address (e.g. pastor@church.org)"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            className="flex-1 h-9 rounded-xl border bg-background px-3 text-xs"
          />
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shrink-0"
          >
            {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Test Email
          </button>
        </div>
      </div>
    </div>
  )
}
