'use client'

import { useState } from 'react'
import { Sparkles, Bot, Copy, Check, Loader2, BookOpen, MessageSquare, Send } from 'lucide-react'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function AIStudioPage() {
  const { church } = useChurchStore()
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('sermon_reels')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setResult(
        `[AI Generated Content for ${church?.name ?? 'Church'}]\n\n` +
          `Key Message: "${prompt}"\n\n` +
          `1. Social Media Hook: "Did you know God is working behind the scenes for your breakthrough?"\n` +
          `2. Scripture Focus: Psalm 23:1 — "The Lord is my shepherd; I shall not want."\n` +
          `3. Call to Action: Join us this Sunday at ${church?.name ?? 'our service'}!`
      )
      toast.success('AI content generated!')
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-500" />
          AI Studio & Content Generator
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Autonomous AI content studio powered by Claude 3.5 Sonnet for {church?.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Content Generator</h2>
          <form onSubmit={handleGenerate} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              >
                <option value="sermon_reels">Sermon Clips & Reels Captions</option>
                <option value="visitor_followup">Visitor Follow-Up Message</option>
                <option value="devotional">Daily Devotional Prompt</option>
                <option value="event_announcement">Event Promotion Post</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Sermon Theme / Topic *</label>
              <textarea
                rows={4}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter sermon topic, scriptures, or key points..."
                className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generate AI Content
            </button>
          </form>
        </div>

        {/* AI Output Window */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-sm font-bold text-foreground">Generated Output</h2>
            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:underline"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-xl border bg-muted/20 p-4 text-xs font-mono whitespace-pre-wrap text-foreground overflow-y-auto min-h-[200px]">
            {result || 'Generated content will appear here...'}
          </div>
        </div>
      </div>
    </div>
  )
}
