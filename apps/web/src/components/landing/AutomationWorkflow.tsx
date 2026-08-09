'use client'

import {
  QrCode,
  Sparkles,
  MessageSquare,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react'

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Visitor Arrives & Scans QR',
    desc: 'Digital visitor form captures name, phone, prayer needs, and invited-by details in 15 seconds.',
    icon: QrCode,
    badge: 'Check-In',
  },
  {
    step: '02',
    title: 'Instant Personalized Welcome',
    desc: 'Automated WhatsApp & SMS welcome note with senior pastor message sent within 5 minutes.',
    icon: MessageSquare,
    badge: 'Day 1',
  },
  {
    step: '03',
    title: 'Midweek Pastoral Care Check-In',
    desc: 'Assigned to a follow-up minister with prayer response and cell group invitation.',
    icon: Sparkles,
    badge: 'Day 3',
  },
  {
    step: '04',
    title: 'Sunday Service Reminder & Retention',
    desc: 'Special invitation to upcoming service with sermon title notes and parking details.',
    icon: Calendar,
    badge: 'Day 7',
  },
  {
    step: '05',
    title: 'Integrated into Membership Track',
    desc: 'Visitor progresses to Foundation School & department placement in your unified member database.',
    icon: Users,
    badge: 'Discipleship',
  },
]

export function AutomationWorkflow() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/20 border-y border-border/50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Layers className="h-3.5 w-3.5" />
            <span>Automated Ministry Journey</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Autonomous Workflows That Nurture Every Soul.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From first-time guest to active church worker. See how Church Growth OS automates spiritual journeys without losing the personal touch.
          </p>
        </div>

        {/* 5-Step Horizontal / Stacked Timeline */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {WORKFLOW_STEPS.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="relative rounded-3xl border border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between space-y-4 group hover:border-brand-500/40 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-display text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" /> Fully Automated
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
