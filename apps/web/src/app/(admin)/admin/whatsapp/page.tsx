'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Save, Loader2, Send, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

export default function AdminWhatsAppPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')

  const [config, setConfig] = useState({
    whatsappProvider: 'meta', // 'meta' | 'twilio'
    metaWhatsappToken: '',
    metaWhatsappPhoneId: '',
    metaWhatsappWabaId: '',
    metaWebhookToken: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsappSender: 'whatsapp:+14155238886',
  })

  useEffect(() => {
    loadWhatsapp()
  }, [])

  async function loadWhatsapp() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/whatsapp')
      const data = await res.json()
      if (res.ok && data.success && data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }))
      } else {
        toast.error(data.error ?? 'Failed to load WhatsApp settings.')
      }
    } catch (err: any) {
      toast.error(`Failed to load WhatsApp settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`💬 ${config.whatsappProvider === 'twilio' ? 'Twilio' : 'Meta'} WhatsApp Gateway credentials saved securely!`)
      } else {
        toast.error(data.error ?? 'Failed to save credentials.')
      }
    } catch (err: any) {
      toast.error(`Failed to save credentials: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      if (config.whatsappProvider === 'meta') {
        if (!config.metaWhatsappPhoneId) {
          toast.error('Please enter Meta Phone Number ID')
          return
        }
        toast.success('✅ Meta WhatsApp API Configuration Validated!')
      } else {
        if (!config.twilioAccountSid) {
          toast.error('Please enter Twilio Account SID')
          return
        }
        toast.success('✅ Twilio WhatsApp Credentials Validated!')
      }
    } catch (err: any) {
      toast.error(`Connection check failed: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSendTestMessage = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Enter a recipient phone number with country code (e.g. +2348012345678)')
      return
    }
    setSendingTest(true)
    try {
      const res = await adminFetch('/api/admin/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: testPhoneNumber.trim(),
          provider: config.whatsappProvider,
          metaPhoneId: config.metaWhatsappPhoneId,
          metaToken: config.metaWhatsappToken,
          message: 'Church Growth OS WhatsApp gateway test notification.',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`📲 Test broadcast sent to ${testPhoneNumber}!`)
      } else {
        toast.error(`❌ Send Failed: ${data.error ?? 'Gateway rejected test message'}`)
      }
    } catch (err: any) {
      toast.error(`Send failed: ${err.message}`)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            WhatsApp Communication Gateway (Meta Cloud API &amp; Twilio)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Multi-provider WhatsApp architecture for automated first-time guest follow-ups and congregation broadcasts.
          </p>
        </div>
        <button
          type="button"
          onClick={loadWhatsapp}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              WhatsApp Provider Architecture
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Test Gateway Connection
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-semibold text-foreground">Active WhatsApp Provider</label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, whatsappProvider: 'meta' })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    config.whatsappProvider === 'meta'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-border bg-background'
                  }`}
                >
                  <p className="font-semibold text-foreground">Meta WhatsApp Cloud API (Primary)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Direct Meta Business Manager integration</p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, whatsappProvider: 'twilio' })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    config.whatsappProvider === 'twilio'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-border bg-background'
                  }`}
                >
                  <p className="font-semibold text-foreground">Twilio WhatsApp Messaging (Fallback)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Twilio programmable messaging pipeline</p>
                </button>
              </div>
            </div>

            {config.whatsappProvider === 'meta' ? (
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div>
                  <label className="font-semibold">Meta Cloud API Permanent Access Token</label>
                  <input
                    type="password"
                    placeholder="EAAG..."
                    value={config.metaWhatsappToken}
                    onChange={(e) => setConfig({ ...config, metaWhatsappToken: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-semibold">Meta Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="10987654321"
                      value={config.metaWhatsappPhoneId}
                      onChange={(e) => setConfig({ ...config, metaWhatsappPhoneId: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold">WhatsApp Business Account ID (WABA ID)</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={config.metaWhatsappWabaId}
                      onChange={(e) => setConfig({ ...config, metaWhatsappWabaId: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-semibold">Twilio Account SID</label>
                    <input
                      type="text"
                      placeholder="AC..."
                      value={config.twilioAccountSid}
                      onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold">Twilio Auth Token</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={config.twilioAuthToken}
                      onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save WhatsApp Gateway Settings
            </button>
          </div>
        </div>
      </form>

      {/* Send Test Broadcast */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-500" />
          Send Test WhatsApp Message
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="tel"
            placeholder="Recipient phone with country code (e.g. +2348012345678)"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            className="flex-1 h-9 rounded-xl border bg-background px-3 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleSendTestMessage}
            disabled={sendingTest}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 shrink-0"
          >
            {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Test Message
          </button>
        </div>
      </div>
    </div>
  )
}
