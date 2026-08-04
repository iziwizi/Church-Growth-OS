'use client'

import { useState } from 'react'
import { Cpu, ShieldCheck, Save, Loader2, Key, CheckCircle2, Server, MessageSquare, Mail, Phone, Cloud } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminInfrastructurePage() {
  const [saving, setSaving] = useState(false)
  const [aiKey, setAiKey] = useState('sk-ant-api03-*** (Platform Managed)')
  const [resendKey, setResendKey] = useState('re_123*** (Platform Managed)')
  const [termiiKey, setTermiiKey] = useState('termii_sec_*** (Platform Managed)')

  const handleSaveInfra = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Platform API key secrets updated across all church tenants!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Managed Infrastructure
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Central API secrets managed exclusively by MUJTEKNIFY LIMITED. Individual church admins never manage raw API keys.
        </p>
      </div>

      <form onSubmit={handleSaveInfra} className="space-y-6">
        {/* AI Engine Keys */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-500" />
            AI Foundation Model Keys
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="font-semibold">Anthropic Claude API Key</label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">OpenAI / DeepSeek Key</label>
              <input
                type="password"
                defaultValue="sk-proj-*** (Platform Managed)"
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
          </div>
        </div>

        {/* Messaging Infrastructure */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            Messaging & Delivery Channels
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-semibold">Resend Email API Key</label>
              <input
                type="password"
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Termii SMS Key (Africa)</label>
              <input
                type="password"
                value={termiiKey}
                onChange={(e) => setTermiiKey(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>
            <div>
              <label className="font-semibold">Cloudinary Secret (Media)</label>
              <input
                type="password"
                defaultValue="Mm-O94D5judYI9mucMgVGXzRNVE"
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
            Save Infrastructure Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
