'use client'

import Link from 'next/link'
import { ArrowRight, Church, Sparkles, CheckCircle2 } from 'lucide-react'

export function FinalCta() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-brand-500/40 bg-gradient-to-b from-card via-brand-500/5 to-card p-8 sm:p-16 text-center space-y-6 shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/20">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Church className="h-6 w-6" />
            </div>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.15] text-balance">
            Give Your Ministry the Operating System It Deserves.
          </h2>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bring your people, operations, communication, and growth strategy into one intelligent ministry platform.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:scale-[1.02] transition-all"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-7 py-4 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <span>Sign In to Existing Account</span>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14 Days Free
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Instant Setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Cancel Anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
