'use client'

import { motion } from 'framer-motion'
import {
  XCircle,
  CheckCircle2,
  FileSpreadsheet,
  MessageCircle,
  HelpCircle,
  Database,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react'

export function ProblemSolution() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
            <span>The Modern Ministry Challenge</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Your Ministry Shouldn't Run on Spreadsheets, WhatsApp Threads, and Scattered Tools.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Churches often lose first-time visitors, scramble to compile weekly numbers, and juggle 6 different disconnected apps. Church Growth OS unifies your entire pastoral and administrative workflow.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Scattered Way */}
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">The Fragmented Way</h3>
                <p className="text-xs text-muted-foreground">Scattered across ad-hoc tools</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>First-time visitor slips get lost or take days to follow up manually.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Pastors wait until midweek meetings just to know last Sunday's real attendance and giving.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>WhatsApp broadcast lists get blocked or messy with personal phone numbers.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Staff members don't have clear role permissions, risking private ministry data.</span>
              </li>
            </ul>
          </div>

          {/* The Church Growth OS Way */}
          <div className="rounded-3xl border border-brand-500/40 bg-brand-500/5 p-6 sm:p-8 space-y-6 shadow-xl shadow-brand-500/5 ring-1 ring-brand-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">The Church Growth OS Way</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">One Intelligent Operating System</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-foreground/90 font-medium">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Instant automated QR &amp; digital visitor check-ins with personalized multi-day nurture.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Autonomous 6:00 AM executive growth briefings delivered straight to leadership.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Verified WhatsApp Meta Cloud, Email &amp; SMS delivery pipeline with zero spam bans.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Granular 13-module role permission matrix with human approval safety queues.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
