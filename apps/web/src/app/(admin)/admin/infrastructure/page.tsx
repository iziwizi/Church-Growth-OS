'use client'

import { useState, useEffect } from 'react'
import { Cpu, Save, Loader2, MessageSquare, Mail, Phone, Cloud, DollarSign, ShieldCheck } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminInfrastructurePage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // 11 Required Infrastructure Configs
  const [config, setConfig] = useState({
    deepseekKey: '',
    claudeKey: '',
    openaiKey: '',
    geminiKey: '',
    openrouterKey: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    resendKey: '',
    metaWhatsappToken: '',
    metaWhatsappPhoneId: '',
    termiiKey: '',
    paystackSecret: '',
    flutterwaveSecret: '',
    stripeSecret: '',
  })

  useEffect(() => {
    loadInfraConfig()
  }, [])

  async function loadInfraConfig() {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
      if (snap && snap.exists()) {
        setConfig((prev) => ({ ...prev, ...snap.data() }))
      }
    } catch {
      toast.error('Failed to load system infrastructure config.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveInfra = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'system', 'infrastructure'),
        {
          ...config,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('🔒 All 11 Platform API Secrets saved securely to Firestore!')
    } catch {
      toast.error('Failed to save secrets.')
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
          Super Admin Infrastructure Secrets
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Central API credentials managed exclusively by MUJTEKNIFY LIMITED. Church administrators never manage raw API keys.
        </p>
      </div>

      <form onSubmit={handleSaveInfra} className="space-y-6">
        {/* 1. AI Models */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-500" />
            AI Foundation Model Keys (Claude, OpenAI, DeepSeek, Gemini)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="font-semibold">Anthropic Claude API Key</label>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={config.claudeKey}
                onChange={(e) => setConfig({ ...config, claudeKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={config.openaiKey}
                onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">DeepSeek API Key</label>
              <input
                type="password"
                placeholder="sk-deepseek-..."
                value={config.deepseekKey}
                onChange={(e) => setConfig({ ...config, deepseekKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.geminiKey}
                onChange={(e) => setConfig({ ...config, geminiKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">OpenRouter API Key</label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterKey}
                onChange={(e) => setConfig({ ...config, openrouterKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>
        </div>

        {/* 2. Media & Storage */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            Cloudinary Storage Architecture
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-semibold">Cloud Name</label>
              <input
                type="text"
                placeholder="church-growth-os"
                value={config.cloudinaryCloudName}
                onChange={(e) => setConfig({ ...config, cloudinaryCloudName: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">API Key</label>
              <input
                type="text"
                placeholder="1234567890"
                value={config.cloudinaryApiKey}
                onChange={(e) => setConfig({ ...config, cloudinaryApiKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">API Secret</label>
              <input
                type="password"
                placeholder="Mm-O94D..."
                value={config.cloudinaryApiSecret}
                onChange={(e) => setConfig({ ...config, cloudinaryApiSecret: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>
        </div>

        {/* 3. Messaging Channels */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            Communication Delivery Gateways (Resend, WhatsApp Meta, Termii)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="font-semibold">Resend Email API Key</label>
              <input
                type="password"
                placeholder="re_123..."
                value={config.resendKey}
                onChange={(e) => setConfig({ ...config, resendKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Termii SMS Secret Key (Africa)</label>
              <input
                type="password"
                placeholder="termii_sec_..."
                value={config.termiiKey}
                onChange={(e) => setConfig({ ...config, termiiKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Meta WhatsApp Cloud Access Token</label>
              <input
                type="password"
                placeholder="EAA..."
                value={config.metaWhatsappToken}
                onChange={(e) => setConfig({ ...config, metaWhatsappToken: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Meta WhatsApp Phone Number ID</label>
              <input
                type="text"
                placeholder="10987654321"
                value={config.metaWhatsappPhoneId}
                onChange={(e) => setConfig({ ...config, metaWhatsappPhoneId: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>
        </div>

        {/* 4. Payment Gateways */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" />
            Platform Payment Gateways (Paystack, Flutterwave, Stripe)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-semibold">Paystack Secret Key</label>
              <input
                type="password"
                placeholder="sk_live_paystack..."
                value={config.paystackSecret}
                onChange={(e) => setConfig({ ...config, paystackSecret: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Flutterwave Secret Key</label>
              <input
                type="password"
                placeholder="FLWSECK_..."
                value={config.flutterwaveSecret}
                onChange={(e) => setConfig({ ...config, flutterwaveSecret: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Stripe Secret Key</label>
              <input
                type="password"
                placeholder="sk_live_stripe..."
                value={config.stripeSecret}
                onChange={(e) => setConfig({ ...config, stripeSecret: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Platform Secrets
          </button>
        </div>
      </form>
    </div>
  )
}
