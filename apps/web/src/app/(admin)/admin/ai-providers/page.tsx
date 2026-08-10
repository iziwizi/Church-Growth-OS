'use client'

import { useState, useEffect } from 'react'
import {
  Cpu,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  TestTube,
  AlertTriangle,
  Server,
  Layers,
  Globe,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

interface ModelItem {
  id: string
  name: string
  provider?: string
  contextLength?: number
  description?: string
}

export default function AdminAIProvidersPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshingModels, setRefreshingModels] = useState(false)
  const [testingAgentRouter, setTestingAgentRouter] = useState(false)
  const [testingDirect, setTestingDirect] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null)
  const [hasStoredKey, setHasStoredKey] = useState(false)

  const [config, setConfig] = useState({
    agentrouterKey: '',
    agentrouterBaseUrl: 'https://co.agentrouter.org/v1',
    agentrouterProtocol: 'openai' as 'openai' | 'anthropic',
    primaryModel: 'anthropic/claude-3.5-sonnet',
    fallbackModel: 'gpt-4o-mini',
    aiMode: 'autonomous',
    enabled: true,
    lastTested: null as string | null,
    latencyMs: null as number | null,
    status: 'unconfigured',
    taskRouting: {
      VISITOR_FOLLOW_UP: 'anthropic/claude-3.5-sonnet',
      SERMON_SUMMARY: 'anthropic/claude-3.5-sonnet',
      EMAIL_WRITING: 'anthropic/claude-3.5-sonnet',
      WHATSAPP_WRITING: 'gpt-4o-mini',
      CONTENT_SUMMARY: 'gpt-4o-mini',
      DAILY_REPORT: 'anthropic/claude-3.5-sonnet',
      STRATEGIC_ANALYSIS: 'anthropic/claude-3.5-sonnet',
      PRAYER_DEVOTIONAL: 'anthropic/claude-3.5-sonnet',
      EVENT_PROMO: 'gpt-4o-mini',
      STORE_PROMOTION: 'gpt-4o-mini',
    },
    directProviders: {
      openaiKey: '',
      hasOpenaiKey: false,
      anthropicKey: '',
      hasAnthropicKey: false,
      geminiKey: '',
      hasGeminiKey: false,
      deepseekKey: '',
      hasDeepseekKey: false,
    },
  })

  const [discoveredModels, setDiscoveredModels] = useState<ModelItem[]>([
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', provider: 'Anthropic', contextLength: 200000 },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', provider: 'Anthropic', contextLength: 200000 },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Fast)', provider: 'Anthropic', contextLength: 200000 },
    { id: 'gpt-4o', name: 'GPT-4o (OpenAI Omni)', provider: 'OpenAI', contextLength: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Effective)', provider: 'OpenAI', contextLength: 128000 },
    { id: 'o1', name: 'OpenAI o1 (Deep Reasoning)', provider: 'OpenAI', contextLength: 128000 },
    { id: 'o3-mini', name: 'OpenAI o3-mini (Reasoning)', provider: 'OpenAI', contextLength: 128000 },
    { id: 'deepseek-r1', name: 'DeepSeek R1 (Open Reasoning)', provider: 'DeepSeek', contextLength: 64000 },
    { id: 'deepseek-v3', name: 'DeepSeek V3 (High Throughput)', provider: 'DeepSeek', contextLength: 64000 },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google)', provider: 'Google', contextLength: 1000000 },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Google)', provider: 'Google', contextLength: 2000000 },
    { id: 'llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B', provider: 'Meta', contextLength: 128000 },
  ])

  useEffect(() => {
    loadAIConfig()
    loadModels()
  }, [])

  async function loadAIConfig() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/ai-providers')
      const data = await res.json()
      if (res.ok && data.success && data.config) {
        setHasStoredKey(!!data.config.hasAgentRouterKey)
        setConfig((prev) => ({
          ...prev,
          ...data.config,
        }))
      } else {
        toast.error(data.error ?? 'Could not load AI configuration.')
      }
    } catch (err: any) {
      toast.error(`Could not load AI configuration: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function loadModels() {
    try {
      const res = await adminFetch('/api/admin/agentrouter/models')
      if (res.ok) {
        const data = await res.json()
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setDiscoveredModels(data.models)
        }
      }
    } catch {
      // Keep curated defaults
    }
  }

  const handleRefreshModels = async () => {
    setRefreshingModels(true)
    try {
      const res = await adminFetch('/api/admin/agentrouter/models')
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = await res.json()
      if (data.models && data.models.length > 0) {
        setDiscoveredModels(data.models)
        toast.success(`Discovered ${data.models.length} live models from AgentRouter API!`)
      }
    } catch {
      toast.error('Could not refresh AgentRouter model registry.')
    } finally {
      setRefreshingModels(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHasStoredKey(true)
        toast.success('🤖 AgentRouter Gateway & AI Task Routing saved securely!')
        await loadAIConfig()
      } else {
        toast.error(data.error ?? 'Failed to save AI configuration.')
      }
    } catch (err: any) {
      toast.error(`Failed to save AI configuration: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestAgentRouter = async () => {
    setTestingAgentRouter(true)
    setTestResult(null)
    try {
      const res = await adminFetch('/api/admin/agentrouter/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ ok: true, message: data.message ?? 'AgentRouter Connection successful!', latencyMs: data.latencyMs })
        toast.success(`✅ ${data.message}`)
        await loadAIConfig()
      } else {
        setTestResult({ ok: false, message: data.error ?? 'AgentRouter connection failed.' })
        toast.error(data.error ?? 'AgentRouter test failed.')
      }
    } catch (err: any) {
      const msg = err.message ?? 'Test request failed.'
      setTestResult({ ok: false, message: msg })
      toast.error(msg)
    } finally {
      setTestingAgentRouter(false)
    }
  }

  const handleTestDirectProvider = async (provider: string) => {
    setTestingDirect(provider)
    try {
      const res = await adminFetch('/api/admin/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`${data.message} (${data.latencyMs}ms)`)
      } else {
        toast.error(`${provider.toUpperCase()} test failed: ${data.error}`)
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`)
    } finally {
      setTestingDirect(null)
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI Gateway &amp; Provider Architecture
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Centralized AgentRouter.org integration, task-level model routing, and direct provider fallbacks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestAgentRouter}
            disabled={testingAgentRouter}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 px-3.5 py-2 font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {testingAgentRouter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
            Test AgentRouter Connection
          </button>
          <button
            type="button"
            onClick={handleRefreshModels}
            disabled={refreshingModels}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingModels ? 'animate-spin' : ''}`} />
            Refresh Models
          </button>
        </div>
      </div>

      {/* Test Connection Banner */}
      {testResult && (
        <div
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 text-xs font-medium ${
            testResult.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.ok ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{testResult.message}</span>
          </div>
          {testResult.latencyMs && (
            <span className="rounded-lg bg-white/60 px-2 py-1 font-mono text-[11px] font-bold text-foreground">
              {testResult.latencyMs}ms
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. PRIMARY AI GATEWAY: AGENTROUTER ── */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  AgentRouter Unified AI Gateway (agentrouter.org)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Primary execution engine connecting all church AI workflows to multi-model intelligence.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Canonical AI Gateway
            </div>
          </div>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">AgentRouter API Key</label>
                {hasStoredKey && (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Key Saved Server-Side
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="sk-ar-..."
                value={config.agentrouterKey}
                onChange={(e) => setConfig({ ...config, agentrouterKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Your secure AgentRouter key provisioned from agentrouter.org. Stored server-side only.
              </p>
            </div>

            {/* Base URL & Protocol */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold text-foreground">API Base URL</label>
                <input
                  type="text"
                  value={config.agentrouterBaseUrl}
                  onChange={(e) => setConfig({ ...config, agentrouterBaseUrl: e.target.value })}
                  placeholder="https://co.agentrouter.org/v1"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  OpenAI: <code className="font-mono text-[10px]">https://co.agentrouter.org/v1</code> | Anthropic: <code className="font-mono text-[10px]">https://co.agentrouter.org</code>
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground">Protocol Mode</label>
                <select
                  value={config.agentrouterProtocol}
                  onChange={(e) => setConfig({ ...config, agentrouterProtocol: e.target.value as any })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-medium"
                >
                  <option value="openai">OpenAI Compatible (Recommended - /v1/chat/completions)</option>
                  <option value="anthropic">Anthropic Compatible (/v1/messages)</option>
                </select>
              </div>
            </div>

            {/* Default & Fallback Models */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold text-foreground">Primary Default Model</label>
                <select
                  value={config.primaryModel}
                  onChange={(e) => setConfig({ ...config, primaryModel: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2.5 font-semibold text-brand-500"
                >
                  {discoveredModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Fallback Model</label>
                <select
                  value={config.fallbackModel}
                  onChange={(e) => setConfig({ ...config, fallbackModel: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2.5 font-semibold text-muted-foreground"
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

        {/* ── 2. TASK-LEVEL ROUTING MATRIX ── */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  Task-Level AI Model Routing Matrix
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Route specific church workloads to the ideal model for optimal quality, reasoning, and token efficiency.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              10 Ministry Workloads
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {[
              { label: 'First-Time Visitor Follow-up', key: 'VISITOR_FOLLOW_UP', desc: 'Heartfelt, pastoral guest retention' },
              { label: 'Sermon Summary & Repurposing', key: 'SERMON_SUMMARY', desc: 'Deep synthesis & action points' },
              { label: 'Email Newsletter Drafting', key: 'EMAIL_WRITING', desc: 'Engaging congregation bulletins' },
              { label: 'WhatsApp Broadcasts & Reminders', key: 'WHATSAPP_WRITING', desc: 'Concise, emoji-optimized updates' },
              { label: 'Daily Executive Growth Reports', key: 'DAILY_REPORT', desc: '6:00 AM pastoral metrics analysis' },
              { label: 'General Ministry Content Summaries', key: 'CONTENT_SUMMARY', desc: 'Social captions and bullet points' },
              { label: 'Prayer Devotionals & Guides', key: 'PRAYER_DEVOTIONAL', desc: 'Spiritually uplifting scriptural copy' },
              { label: 'Event Promotional Campaigns', key: 'EVENT_PROMO', desc: 'High-energy attendance copy' },
              { label: 'Church Store Resource Promotions', key: 'STORE_PROMOTION', desc: 'Ministry book & course promotions' },
              { label: 'Strategic Growth Bottleneck Analysis', key: 'STRATEGIC_ANALYSIS', desc: 'Deep reasoning for leadership' },
            ].map((task) => (
              <div key={task.key} className="rounded-xl border bg-muted/10 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">{task.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{task.desc}</p>
                <select
                  value={config.taskRouting?.[task.key as keyof typeof config.taskRouting] ?? config.primaryModel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      taskRouting: {
                        ...config.taskRouting,
                        [task.key]: e.target.value,
                      },
                    })
                  }
                  className="flex h-8 w-full rounded-lg border bg-background px-2 text-xs font-semibold text-foreground"
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
        </div>

        {/* ── 3. DIRECT PROVIDERS (OPTIONAL SECONDARY / FALLBACK) ── */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  Direct AI Providers (Optional Fallbacks)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Direct provider API keys configured as standalone options or secondary fallbacks.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">Optional</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* OpenAI */}
            <div className="rounded-xl border bg-muted/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">OpenAI Direct API</span>
                <button
                  type="button"
                  onClick={() => handleTestDirectProvider('openai')}
                  disabled={testingDirect === 'openai'}
                  className="text-[10px] font-semibold text-brand-600 hover:underline disabled:opacity-50"
                >
                  {testingDirect === 'openai' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={config.directProviders?.openaiKey ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    directProviders: { ...config.directProviders, openaiKey: e.target.value },
                  })
                }
                className="flex h-8 w-full rounded-lg border bg-background px-2.5 font-mono text-xs"
              />
            </div>

            {/* Anthropic Claude */}
            <div className="rounded-xl border bg-muted/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Anthropic Claude Direct</span>
                <button
                  type="button"
                  onClick={() => handleTestDirectProvider('anthropic')}
                  disabled={testingDirect === 'anthropic'}
                  className="text-[10px] font-semibold text-brand-600 hover:underline disabled:opacity-50"
                >
                  {testingDirect === 'anthropic' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={config.directProviders?.anthropicKey ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    directProviders: { ...config.directProviders, anthropicKey: e.target.value },
                  })
                }
                className="flex h-8 w-full rounded-lg border bg-background px-2.5 font-mono text-xs"
              />
            </div>

            {/* Google Gemini */}
            <div className="rounded-xl border bg-muted/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Google Gemini Direct</span>
                <button
                  type="button"
                  onClick={() => handleTestDirectProvider('gemini')}
                  disabled={testingDirect === 'gemini'}
                  className="text-[10px] font-semibold text-brand-600 hover:underline disabled:opacity-50"
                >
                  {testingDirect === 'gemini' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.directProviders?.geminiKey ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    directProviders: { ...config.directProviders, geminiKey: e.target.value },
                  })
                }
                className="flex h-8 w-full rounded-lg border bg-background px-2.5 font-mono text-xs"
              />
            </div>

            {/* DeepSeek */}
            <div className="rounded-xl border bg-muted/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">DeepSeek Direct API</span>
                <button
                  type="button"
                  onClick={() => handleTestDirectProvider('deepseek')}
                  disabled={testingDirect === 'deepseek'}
                  className="text-[10px] font-semibold text-brand-600 hover:underline disabled:opacity-50"
                >
                  {testingDirect === 'deepseek' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <input
                type="password"
                placeholder="sk-..."
                value={config.directProviders?.deepseekKey ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    directProviders: { ...config.directProviders, deepseekKey: e.target.value },
                  })
                }
                className="flex h-8 w-full rounded-lg border bg-background px-2.5 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save AI Gateway &amp; Routing Matrix
          </button>
        </div>
      </form>
    </div>
  )
}
