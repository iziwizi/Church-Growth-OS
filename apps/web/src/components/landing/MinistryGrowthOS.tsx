'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Users,
  Compass,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export function MinistryGrowthOS() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden w-full max-w-full">
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-[600px] h-[350px] bg-brand-500/10 blur-[150px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Compass className="h-3.5 w-3.5" />
            <span>Growth Intelligence</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Real-Time Pastoral Intelligence &amp; Objective Tracking.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Gain full clarity over attendance momentum, visitor retention velocity, giving health, and church-wide growth targets.
          </p>
        </div>

        {/* Dashboard-style Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-7 max-w-6xl mx-auto">
          {/* Card 1: 6 AM Daily Growth Briefing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-7 shadow-sm hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                6:00 AM Executive Briefing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every morning, your AI pastoral assistant synthesizes attendance trends, urgent prayer concerns, follow-up progress, and financial summaries into a 2-minute executive digest.
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs text-muted-foreground font-mono border border-border/40">
              &ldquo;38 visitors followed up • ₦1.8M giving reconciled • 2 new home fellowships launched&rdquo;
            </div>
          </motion.div>

          {/* Card 2: Growth Objectives & Milestone Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-7 shadow-sm hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Strategic Ministry Goals
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set annual church objectives (e.g. &ldquo;Plant 3 Satellite Branches&rdquo;, &ldquo;Train 100 Small Group Leaders&rdquo;) and track real milestones directly connected to your member database.
              </p>
            </div>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between font-bold text-foreground">
                <span>Annual Discipleship Goal</span>
                <span className="text-brand-500">74%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full w-3/4" />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Retention & Discipleship Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-7 shadow-sm hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Retention Velocity Funnel
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Know exactly where first-time visitors drop off. Seamlessly nurture them from First Visit to Foundation School, Department Worker, and Committed Leader.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 pt-3">
              <span>Visitor Conversion:</span>
              <span className="text-emerald-500 font-bold">+18.4% Average Increase</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
