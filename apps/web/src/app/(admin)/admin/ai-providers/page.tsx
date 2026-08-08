'use client'

import { useState, useEffect } from 'react'
import { Cpu, Save, Loader2, RefreshCw, CheckCircle2, ShieldCheck, Zap, TestTube, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface OpenRouterModel {
  id: string
  name: string
  contextLength: number
  promptPricing: string
  completionPricing: string
}

export default function AdminAIProvidersPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshingModels, setRefreshingModels] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [config, setConfig] = useState({
    defaultProvider: 'openrouter',
    openrouterKey: '',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    fallbackModel: 'openai/gpt-4o-mini',
    aiMode: 'autonomous',
    enabled: true,
    taskRouting: {
      CONTENT_SUMMARY: 'openai/gpt-4o-mini',
      VISITOR_FOLLOW_UP: 'anthropic/claude-3.5-sonnet',
      EMAIL_WRITING: 'anthropic/claude-3.5-sonnet',
      WHATSAPP_WRITING: 'openai/gpt-4o-mini',
      SERMON_SUMMARY: 'anthropic/claude-3.5-sonnet',
    },
  })

  const [discoveredModels, setDiscoveredModels] = useState<OpenRouterModel[]>([
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000, promptPricing: '0.000003', completionPricing: '0.000015' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Omni)', contextLength: 128000, promptPricing: '0.0000025', completionPricing: '0.00001' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Cost-Effective)', contextLength: 128000, promptPricing: '0.00000015', completionPricing: '0.0000006' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Reasoning)', contextLength: 64000, promptPricing: '0.00000055', completionPricing: '0.00000219' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', contextLength: 1000000, promptPricing: '0.0000001', completionPricing: '0.0000004' },
  ])

  useEffect(() => {
    loadAIConfig()
  }, [])

  async function loadAIConfig() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-providers')
      const data = await res.json()
      if (res.ok && data.success && data.config) {
        setConfig((prev) => ({
          ...prev,
          ...data.config,
        }))
      } else {
        toast.error(data.error ?? 'Could not load AI Provider configuration.')
      }
    } catch (err: any) {
      toast.error(`Could not load AI Provider configuration: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshModels = async () => {
    setRefreshingModels(true)
    try {
      const res = await fetch('/api/admin/openrouter/models')
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = await res.json()
      if (data.models && data.models.length > 0) {
        setDiscoveredModels(data.models)
        toast.success(`Discovered ${data.models.length} models from OpenRouter API!`)
      }
    } catch {
      toast.error('Could not refresh OpenRouter model registry.')
    } finally {
      setRefreshingModels(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('🤖 OpenRouter & AI Task Routing saved securely to server!')
      } else {
        toast.error(data.error ?? 'Failed to save AI configuration.')
      }
    } catch (err: any) {
      toast.error(`Failed to save AI configuration: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/openrouter/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ ok: true, message: data.message ?? 'Connection successful!' })
        toast.success('✅ OpenRouter connection verified!')
      } else {
        setTestResult({ ok: false, message: data.error ?? 'Connection failed.' })
        toast.error(data.error ?? 'OpenRouter test failed.')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI Provider &amp; Model Routing Engine
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure OpenRouter API, model discovery, and task-level routing for church communications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 px-3 py-1.5 font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
            Test Connection
          </button>
          <button
            type="button"
            onClick={handleRefreshModels}
            disabled={refreshingModels}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingModels ? 'animate-spin' : ''}`} />
            Refresh Models
          </button>
        </div>
      </div>

      {/* Test Connection Result */}
      {testResult && (
        <div className={`rounded-xl border p-3 flex items-center gap-2 text-xs font-medium ${
          testResult.ok
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
        }`}>
          {testResult.ok
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{testResult.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* OpenRouter Unified API */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-brand-500" />
              OpenRouter Unified API Gateway
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Canonical AI Provider
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-semibold">OpenRouter API Key</label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterKey}
                onChange={(e) => setConfig({ ...config, openrouterKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Unified gateway supporting Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, and Gemini 2.0 Flash with zero vendor lock-in.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Primary Default Model</label>
                <select
                  value={config.defaultModel}
                  onChange={(e) => setConfig({ ...config, defaultModel: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-semibold text-brand-500"
                >
                  {discoveredModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold">Fallback Model</label>
                <select
                  value={config.fallbackModel}
                  onChange={(e) => setConfig({ ...config, fallbackModel: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-semibold text-muted-foreground"
                >
                  {discoveredModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Task-Level Routing Matrix */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            Task-Level Routing Matrix
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'VISITOR_FOLLOW_UP', label: 'Visitor Follow-up Writing', desc: 'Warm pastoral welcome messages' },
              { id: 'SERMON_SUMMARY', label: 'Sermon Transcript Repurposing', desc: 'Extract key points, scriptures, quotes' },
              { id: 'WHATSAPP_WRITING', label: 'WhatsApp Broadcasts', desc: 'Short, engaging mobile announcements' },
              { id: 'EMAIL_WRITING', label: 'Email Newsletters & Reports', desc: 'Structured ministry communications' },
              { id: 'CONTENT_SUMMARY', label: 'General Content Summarization', desc: 'Fast, cost-effective processing' },
            ].map((t) => (
              <div key={t.id} className="rounded-xl border bg-muted/20 p-3 space-y-2">
                <div>
                  <p className="font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
                <select
                  value={(config.taskRouting as any)[t.id] ?? config.defaultModel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      taskRouting: {
                        ...config.taskRouting,
                        [t.id]: e.target.value,
                      },
                    })
                  }
                  className="flex h-8 w-full rounded-lg border bg-background px-2 text-[11px] font-semibold text-brand-500"
                >
                  {discoveredModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Canonical AI Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
