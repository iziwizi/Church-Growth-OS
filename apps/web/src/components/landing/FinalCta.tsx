'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

export function FinalCta() {
  return (
    <section className="py-20 sm:py-36 relative overflow-hidden w-full max-w-full">
      {/* Dynamic Glow Effects */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-500/20 blur-[150px] rounded-full -z-10" />

      <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl sm:rounded-3xl border border-brand-500/40 bg-gradient-to-b from-card via-brand-500/5 to-card p-5 sm:p-16 text-center space-y-6 sm:space-y-7 shadow-2xl shadow-brand-500/15 ring-1 ring-brand-500/30 w-full"
        >
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={280}
              height={75}
              className="h-10 sm:h-16 w-auto max-w-[200px] sm:max-w-[280px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.15] text-balance">
            Give Your Ministry the Operating System It Deserves.
          </h2>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bring your people, operations, communication, discipleship, and growth strategy into one intelligent ministry platform.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 px-9 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/30 hover:from-brand-500 hover:to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-7 py-4 text-sm font-semibold text-foreground hover:bg-accent transition-all shadow-xs"
            >
              <span>Sign In to Existing Church</span>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14-Day Full Feature Free Trial
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-brand-500" />
              No Credit Card Required
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Instant Setup
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
