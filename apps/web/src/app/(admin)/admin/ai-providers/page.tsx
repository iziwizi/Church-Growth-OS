'use client'

import { useState, useEffect } from 'react'
import { Cpu, Save, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminAIProvidersPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({
    defaultProvider: 'claude',
    claudeModel: 'claude-3-5-sonnet-20241022',
    openaiModel: 'gpt-4o',
    deepseekModel: 'deepseek-chat',
    claudeKey: '',
    openaiKey: '',
    deepseekKey: '',
    geminiKey: '',
  })

  useEffect(() => {
    async function loadAIConfig() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        if (snap && snap.exists()) {
          setConfig((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Could not load AI Provider configuration.')
      } finally {
        setLoading(false)
      }
    }
    loadAIConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'infrastructure'), { ...config, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('🤖 AI Foundation Model configuration saved to Firestore!')
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
          AI Foundation Models &amp; Routing
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage central API keys and default routing for Claude 3.5 Sonnet, GPT-4o, DeepSeek V3, and Gemini 1.5 Pro.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-500" />
            AI Provider Routing
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold">Default Primary AI Provider</label>
              <select
                value={config.defaultProvider}
                onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              >
                <option value="claude">Anthropic Claude (Recommended)</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="deepseek">DeepSeek V3</option>
                <option value="gemini">Google Gemini 1.5 Pro</option>
              </select>
            </div>
            <div>
              <label className="font-semibold">Claude Default Model</label>
              <input
                type="text"
                value={config.claudeModel}
                onChange={(e) => setConfig({ ...config, claudeModel: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t">
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
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save AI Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
