'use client'

import { useState, useEffect } from 'react'
import { Cpu, Save, Loader2, RefreshCw, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
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

  const [config, setConfig] = useState({
    defaultProvider: 'openrouter',
    openrouterKey: '',
    openrouterDefaultModel: 'anthropic/claude-3.5-sonnet',
    openrouterFallbackModel: 'openai/gpt-4o-mini',
    claudeKey: '',
    openaiKey: '',
    deepseekKey: '',
    geminiKey: '',
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
    async function loadAIConfig() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          const data = snap.data()
          setConfig((prev) => ({
            ...prev,
            ...data,
            taskRouting: {
              ...prev.taskRouting,
              ...(data?.taskRouting ?? {}),
            },
          }))
        }
      } catch {
        toast.error('Could not load AI Provider configuration.')
      } finally {
        setLoading(false)
      }
    }
    loadAIConfig()
  }, [])

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
      await setDoc(doc(db, 'system', 'infrastructure'), { ...config, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('🤖 OpenRouter & AI Task Routing saved to Firestore!')
    } catch {
      toast.error('Failed to save AI configuration.')
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
          AI Foundation Models &amp; OpenRouter Routing
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage OpenRouter unified API, model discovery, and cost-conscious task-level model selection for MUJTEKNIFY LIMITED.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* OpenRouter Configuration */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              OpenRouter Universal AI Gateway (Part 10 &amp; 11)
            </h2>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={refreshingModels}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshingModels ? 'animate-spin' : ''}`} />
              Refresh OpenRouter Models
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold">Primary AI Provider</label>
              <select
                value={config.defaultProvider}
                onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold text-purple-500"
              >
                <option value="openrouter">OpenRouter Unified API (Recommended)</option>
                <option value="claude">Direct Anthropic Claude API</option>
                <option value="openai">Direct OpenAI API</option>
                <option value="deepseek">Direct DeepSeek V3 API</option>
                <option value="gemini">Direct Google Gemini API</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">OpenRouter Secret API Key (Server-Side Only)</label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterKey}
                onChange={(e) => setConfig({ ...config, openrouterKey: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              />
            </div>

            <div>
              <label className="font-semibold">Default Primary Model</label>
              <select
                value={config.openrouterDefaultModel}
                onChange={(e) => setConfig({ ...config, openrouterDefaultModel: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
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
                value={config.openrouterFallbackModel}
                onChange={(e) => setConfig({ ...config, openrouterFallbackModel: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
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

        {/* Task-Level Model Routing */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Task-Level Model Routing (Cost-Conscious Defaults)
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { taskKey: 'VISITOR_FOLLOW_UP', label: 'Visitor Follow-up Writing', defaultModel: 'anthropic/claude-3.5-sonnet' },
              { taskKey: 'CONTENT_SUMMARY', label: 'Social Post & Sermon Summaries', defaultModel: 'openai/gpt-4o-mini' },
              { taskKey: 'EMAIL_WRITING', label: 'Executive Email Drafting', defaultModel: 'anthropic/claude-3.5-sonnet' },
              { taskKey: 'WHATSAPP_WRITING', label: 'WhatsApp Broadcast Generator', defaultModel: 'openai/gpt-4o-mini' },
              { taskKey: 'SERMON_SUMMARY', label: 'Sermon Transcript Breakdown', defaultModel: 'anthropic/claude-3.5-sonnet' },
            ].map(({ taskKey, label }) => (
              <div key={taskKey} className="rounded-xl border p-3 bg-muted/10 space-y-1">
                <p className="font-bold text-foreground">{label}</p>
                <select
                  value={(config.taskRouting as any)[taskKey] ?? 'openai/gpt-4o-mini'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      taskRouting: { ...config.taskRouting, [taskKey]: e.target.value },
                    })
                  }
                  className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 text-xs"
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

        {/* Direct Provider Secrets Fallback */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">Direct Provider API Keys (Fallback)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold">Anthropic Claude API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
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
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save AI Provider Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
