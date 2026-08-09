'use client'

import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  MessageSquare,
  DollarSign,
  Calendar,
  Zap,
  Sparkles,
  BarChart3,
} from 'lucide-react'

const VALUE_PILLARS = [
  { label: 'Members', icon: Users, desc: 'Centralized directory & roles' },
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
    <section className="py-14 border-y border-border/60 bg-gradient-to-b from-card/50 via-muted/30 to-card/50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 space-y-1">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400">
            One Platform. Every Ministry Workflow.
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            Eliminate Scattered Spreadsheets &amp; Disconnected Tools
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {VALUE_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-4 text-center shadow-sm hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-default"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-xs">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {pillar.label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
