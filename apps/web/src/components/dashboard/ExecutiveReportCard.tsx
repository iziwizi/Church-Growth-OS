'use client'

import Link from 'next/link'
import { Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

interface ExecutiveReportCardProps {
  churchName?: string
  date?: string
  summary?: string
  messagesSent?: number
  deliveryRate?: number
  visitors?: number
  followUpsDue?: number
}

export function ExecutiveReportCard({
  churchName = 'Your Ministry',
  date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  summary = 'AI processed 24h metrics: 318 active members evaluated for engagement. 5 high-priority follow-ups scheduled for pastor review. Morning declaration broadcast dispatched via WhatsApp with 98% delivery rate.',
  messagesSent = 318,
  deliveryRate = 98,
  visitors = 14,
  followUpsDue = 5,
}: ExecutiveReportCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-foreground">Daily Ministry Intelligence</h3>
              <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
                6:00 AM Digest
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{churchName} • {date}</p>
          </div>
        </div>

        <Link
          href="/reports"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          View Full Report
        </Link>
      </div>

      {/* Executive Summary Preview */}
      <div className="my-4 rounded-xl border border-border bg-background/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-500 mb-1">AI Executive Summary</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{summary}</p>
      </div>

      {/* Key Metrics Quick Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Messages Sent</p>
          <p className="font-display text-lg font-bold text-foreground mt-0.5">{messagesSent}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Delivery Rate</p>
          <p className="font-display text-lg font-bold text-emerald-500 mt-0.5">{deliveryRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">New Visitors</p>
          <p className="font-display text-lg font-bold text-brand-500 mt-0.5">+{visitors}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Follow-ups Due</p>
          <p className="font-display text-lg font-bold text-amber-500 mt-0.5">{followUpsDue}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Report automatically dispatched to Email &amp; WhatsApp
        </div>
        <Link href="/reports" className="sm:hidden flex items-center gap-1 font-semibold text-brand-500">
          Full Report <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
