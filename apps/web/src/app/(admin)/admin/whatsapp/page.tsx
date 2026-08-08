'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Save, Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminWhatsAppPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')

  const [config, setConfig] = useState({
    whatsappProvider: 'meta', // 'meta' | 'twilio'
    // Meta Cloud API
    metaWhatsappToken: '',
    metaWhatsappPhoneId: '',
    metaWhatsappWabaId: '',
    metaWebhookToken: '',
    // Twilio WhatsApp
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsappSender: 'whatsapp:+14155238886',
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
      toast.success(`💬 ${config.whatsappProvider === 'twilio' ? 'Twilio' : 'Meta'} WhatsApp Gateway credentials saved to Firestore!`)
    } catch {
      toast.error('Failed to save credentials.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      if (config.whatsappProvider === 'meta') {
        if (!config.metaWhatsappPhoneId || !config.metaWhatsappToken) {
          toast.error('Please enter Meta Phone Number ID and Access Token')
          return
        }
        // Test Meta API status call
        const res = await fetch(`https://graph.facebook.com/v19.0/${config.metaWhatsappPhoneId}`, {
          headers: { Authorization: `Bearer ${config.metaWhatsappToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          toast.success(`✅ Meta WhatsApp API Connection Successful! (Phone: ${data.display_phone_number ?? 'Verified'})`)
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(`❌ Connection Failed: ${err.error?.message ?? 'Invalid credentials'}`)
        }
      } else {
        if (!config.twilioAccountSid || !config.twilioAuthToken) {
          toast.error('Please enter Twilio Account SID and Auth Token')
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
      const res = await fetch('/api/admin/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.whatsappProvider,
          recipientPhone: testPhoneNumber.trim(),
          metaPhoneId: config.metaWhatsappPhoneId,
          metaToken: config.metaWhatsappToken,
          twilioAccountSid: config.twilioAccountSid,
          twilioAuthToken: config.twilioAuthToken,
          twilioSender: config.twilioWhatsappSender,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`📲 Test WhatsApp message sent to ${testPhoneNumber}!`)
      } else {
        toast.error(`❌ Delivery Failed: ${data.error ?? 'Provider rejected message'}`)
      }
    } catch (err: any) {
      toast.error(`Failed to send test message: ${err.message}`)
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
          WhatsApp Delivery Gateway Architecture
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure Meta Cloud API or Twilio WhatsApp providers for automated pastoral follow-ups and visitor broadcasts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              WhatsApp Provider Abstraction (Part 15 &amp; 16)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Test Connection
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground">Active WhatsApp Provider</label>
            <select
              value={config.whatsappProvider}
              onChange={(e) => setConfig({ ...config, whatsappProvider: e.target.value })}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold text-emerald-500"
            >
              <option value="meta">Meta WhatsApp Cloud API (Direct Official Gateway)</option>
              <option value="twilio">Twilio WhatsApp Business API</option>
            </select>
          </div>

          {config.whatsappProvider === 'meta' ? (
            <div className="space-y-3 pt-2 border-t">
              <p className="font-bold text-foreground">Meta Business Cloud API Configuration</p>
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
          ) : (
            <div className="space-y-3 pt-2 border-t">
              <p className="font-bold text-foreground">Twilio WhatsApp API Configuration</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold">Twilio Account SID</label>
                  <input
                    type="password"
                    placeholder="AC..."
                    value={config.twilioAccountSid}
                    onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold">Twilio Auth Token</label>
                  <input
                    type="password"
                    placeholder="token..."
                    value={config.twilioAuthToken}
                    onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold">Twilio WhatsApp Sender Number</label>
                <input
                  type="text"
                  placeholder="whatsapp:+14155238886"
                  value={config.twilioWhatsappSender}
                  onChange={(e) => setConfig({ ...config, twilioWhatsappSender: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save WhatsApp Settings
            </button>
          </div>
        </div>
      </form>

      {/* Test Message Component */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-500" />
          Send Test WhatsApp Message
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Recipient phone number with country code (+2348000000000)"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            className="flex-1 h-9 rounded-xl border bg-background px-3 text-xs"
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
