'use client'

import { motion } from 'framer-motion'
import { XCircle, CheckCircle2, AlertTriangle, Sparkles, Layers } from 'lucide-react'

export function ProblemSolution() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative bg-muted/30 border-b border-border/50">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[140px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>The Reality of Ministry Operations</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Stop Losing Visitors and Wasting Hours on Disconnected Tools.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            See how Church Growth OS transforms daily ministry administration from chaotic manual firefighting into smooth, intelligent automation.
          </p>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Left Column: Fragmented Way */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-rose-500/30 bg-card/90 backdrop-blur-md p-7 sm:p-9 space-y-6 shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500">
                <XCircle className="h-3.5 w-3.5" />
                <span>The Fragmented Way</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Manual spreadsheets, lost follow-ups, and scattered tools.
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Churches juggle 6 to 10 disconnected platforms, causing visitors to slip through the cracks and leadership to operate blindly.
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-muted-foreground border-t border-border/40 pt-6">
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Visitor cards sit in boxes for days before anyone calls or messages them.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Pastoral leadership has zero visibility into real week-over-week retention trends.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Staff manually send messages one-by-one from personal WhatsApp accounts.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Tithes and giving records are scattered across various banks and ad-hoc sheets.</span>
              </li>
            </ul>
          </motion.div>

          {/* Right Column: The Church Growth OS Way */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border-2 border-brand-500 bg-card p-7 sm:p-9 space-y-6 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/20 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span>The Church Growth OS Way</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                One intelligent platform. Autonomous workflows. Total oversight.
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Everything connects in real-time. Automated nurturing begins the second a visitor checks in, giving leadership instant clarity.
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-foreground/90 font-medium border-t border-border/40 pt-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Instant automated digital visitor check-ins with personalized multi-day nurture.</span>
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
                <span>Centralized giving records across Paystack, Flutterwave, Stripe &amp; bank accounts.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
