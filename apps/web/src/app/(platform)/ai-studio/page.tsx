'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Bot, Copy, Check, Loader2, Clock, Trash2 } from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'

const CONTENT_TYPES = [
  { value: 'sermon_reels', label: 'Sermon Reel Script' },
  { value: 'sermon_summary', label: 'Sermon Summary & 3 Action Points' },
  { value: 'whatsapp_broadcast', label: 'WhatsApp Broadcast Message' },
  { value: 'announcement', label: 'Church Announcement' },
  { value: 'newsletter', label: 'Newsletter Article' },
  { value: 'prayer_content', label: 'Prayer Guide / Devotional' },
  { value: 'event_promo', label: 'Event Promotion Copy' },
  { value: 'follow_up', label: 'Visitor Follow-Up Message' },
]

export default function AIStudioPage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('sermon_reels')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!church?.id) return
    loadHistory()
  }, [church?.id])

  async function loadHistory() {
    if (!church?.id) return
    setLoadingHistory(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'aiContent'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setHistory(list)
    } catch (err) {
      console.error('Error loading AI history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !church?.id) return
    setGenerating(true)
    setResult('')
    try {
      const idToken = await getIdToken()
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          contentType,
          churchName: church.name,
          churchId: church.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error ?? 'Generation failed')
      }

      const generated = data.result as string
      setResult(generated)

      // Persist to Firestore
      const ref = await addDoc(collection(db, 'churches', church.id, 'aiContent'), {
        prompt: prompt.trim(),
        contentType,
        result: generated,
        provider: data.provider ?? 'ai',
        generatedBy: user?.uid ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      })

      // Optimistically add to history
      setHistory((prev) => [
        {
          id: ref.id,
          prompt: prompt.trim(),
          contentType,
          result: generated,
          createdAt: new Date(),
        },
        ...prev.slice(0, 9),
      ])

      if (data.usedTemplateFallback) {
        toast.warning('AI providers are currently unavailable — showing a basic template instead. No credits were used.')
      } else {
        toast.success('🎉 AI content generated and credits tracked!')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to generate content.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLoadHistoryItem = (item: any) => {
    setPrompt(item.prompt)
    setContentType(item.contentType)
    setResult(item.result)
  }

  const handleDeleteHistoryItem = async (id: string) => {
    if (!church?.id) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'aiContent', id))
      setHistory((prev) => prev.filter((h) => h.id !== id))
      toast.success('Content removed from history.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const contentTypeLabel = CONTENT_TYPES.find((t) => t.value === contentType)?.label ?? contentType

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-500" />
          AI Studio &amp; Ministry Content Engine
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Autonomous pastoral content, sermon summaries, reels, and WhatsApp broadcasts for {church?.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Generator Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand-500" />
            Content Generator
          </h2>
          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label className="font-semibold">Content Category</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 font-semibold text-brand-500 focus:outline-none"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold">Theme / Sermon Notes / Message Topic *</label>
              <textarea
                rows={5}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Paste sermon transcript, topic, or message notes for your ${contentTypeLabel.toLowerCase()}...`}
                className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 resize-none text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating Ministry Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate AI Content
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-display text-sm font-bold text-foreground">Generated Output</h2>
              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border px-3 text-xs font-semibold hover:bg-accent"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {result ? (
              <div className="rounded-xl border bg-muted/20 p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground max-h-72 overflow-y-auto font-mono">
                {result}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-brand-500/40" />
                <p className="text-xs text-muted-foreground">
                  Generated copy will appear here ready to broadcast or post.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation History */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold text-foreground">Recent Generations</h2>
        </div>
        {loadingHistory ? (
          <div className="flex h-28 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No generated content yet. Use the generator above to create your first piece.
          </div>
        ) : (
          <div className="divide-y divide-border text-xs">
            {history.map((h) => (
              <div key={h.id} className="flex items-start justify-between gap-4 p-3.5 hover:bg-muted/20">
                <button
                  type="button"
                  onClick={() => handleLoadHistoryItem(h)}
                  className="flex-1 text-left space-y-0.5"
                >
                  <p className="font-semibold text-foreground truncate max-w-md">{h.prompt}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {CONTENT_TYPES.find((t) => t.value === h.contentType)?.label ?? h.contentType}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteHistoryItem(h.id)}
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
