'use client'

import { motion } from 'framer-motion'
import {
  UserPlus,
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
    title: 'First-Time Guest Check-In',
    desc: 'Digital visitor check-in captures name, contact details, prayer needs, and invited-by info smoothly.',
    icon: UserPlus,
    badge: 'Check-In',
  },
  {
    step: '02',
    title: 'Instant Welcome Note',
    desc: 'Automated WhatsApp & SMS welcome note with senior pastor video greeting sent within 5 minutes.',
    icon: MessageSquare,
    badge: 'Day 1',
  },
  {
    step: '03',
    title: 'Midweek Pastoral Care',
    desc: 'Assigned to a follow-up minister with prayer response and cell group fellowship invitation.',
    icon: Sparkles,
    badge: 'Day 3',
  },
  {
    step: '04',
    title: 'Sunday Service Reminder',
    desc: 'Special invitation to upcoming service with sermon title notes and reserved priority parking.',
    icon: Calendar,
    badge: 'Day 7',
  },
  {
    step: '05',
    title: 'Discipleship & Ministry Class',
    desc: 'Automated graduation into believer foundation classes, departmental worker induction, and baptism.',
    icon: Award,
    badge: 'Day 14-30',
  },
]

export function AutomationWorkflow() {
  return (
    <section className="py-24 sm:py-32 relative bg-muted/30 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Layers className="h-3.5 w-3.5" />
            <span>Automated Discipleship Pipeline</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            The 5-Step Journey from First-Time Visitor to Active Disciple.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Never let another guest walk out of church without intentional, compassionate, automated pastoral care.
          </p>
        </div>

        {/* 5-Step Timeline Grid with Visual Connection */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 relative">
          {WORKFLOW_STEPS.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-brand-500/50 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-brand-600 dark:text-brand-400">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/40">
                      {item.badge}
                    </span>
                  </div>

                  <div className="h-11 w-11 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-2xs">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-display text-sm font-bold text-foreground leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Automated Workflow</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
