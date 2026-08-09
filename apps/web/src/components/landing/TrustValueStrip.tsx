'use client'

import {
  Users,
  UserPlus,
  MessageSquare,
  DollarSign,
  Calendar,
  Zap,
  Sparkles,
  BarChart3,
  BookOpen,
  Radio,
  Heart,
  ShoppingBag,
} from 'lucide-react'

const VALUE_PILLARS = [
  { label: 'Members', icon: Users, desc: 'Centralized directory & records' },
  { label: 'Visitors', icon: UserPlus, desc: 'Automated 1st-time nurture' },
  { label: 'Communication', icon: MessageSquare, desc: 'WhatsApp, Email & SMS' },
  { label: 'Giving', icon: DollarSign, desc: 'Reconciled multi-channel tithes' },
  { label: 'Events', icon: Calendar, desc: 'Attendance & registration' },
  { label: 'Automation', icon: Zap, desc: 'Intelligent ministry workflows' },
  { label: 'AI Studio', icon: Sparkles, desc: 'Sermon & content repurposing' },
  { label: 'Reports', icon: BarChart3, desc: 'Executive pastoral briefings' },
]

export function TrustValueStrip() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400">
            One Platform. Every Ministry Workflow.
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-foreground">
            Eliminate Scattered Tools &amp; Fragmented Data
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {VALUE_PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.label}
                className="group rounded-2xl border border-border/60 bg-card p-3.5 text-center shadow-2xs hover:border-brand-500/40 hover:shadow-md transition-all flex flex-col items-center justify-center space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{pillar.label}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{pillar.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
