'use client'

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
    <section className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: 6 AM Daily Growth Briefing */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              6:00 AM Executive Briefing
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every morning, your AI pastor assistant synthesizes yesterday's attendance, pending prayer concerns, follow-up progress, and financial summaries into a 2-minute executive digest.
            </p>
            <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
              "38 visitors followed up • ₦1.8M giving reconciled • 2 new home fellowships launched"
            </div>
          </div>

          {/* Card 2: Growth Objectives & Milestone Tracking */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Strategic Ministry Goals
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Set annual church objectives (e.g. "Plant 3 Satellite Branches", "Train 100 Small Group Leaders") and track real milestones directly connected to your member database.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between font-semibold text-foreground">
                <span>Annual Discipleship Goal</span>
                <span className="text-brand-500">74%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full w-3/4" />
              </div>
            </div>
          </div>

          {/* Card 3: Retention & Discipleship Funnel */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Retention Velocity Funnel
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Know exactly where first-time visitors drop off. Seamlessly nurture them from First Visit $\to$ Foundation School $\to$ Department Worker $\to$ Committed Leader.
            </p>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-t pt-3">
              <span>Visitor Conversion:</span>
              <span className="text-emerald-500 font-bold">+18.4% Average Increase</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
