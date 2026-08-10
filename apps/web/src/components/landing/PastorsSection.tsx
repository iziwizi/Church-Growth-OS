'use client'

import { motion } from 'framer-motion'
import {
  Crown,
  HeartHandshake,
  Shield,
  Eye,
  BellRing,
  Award,
  Sparkles,
  Users2,
} from 'lucide-react'

const PASTORAL_BENEFITS = [
  {
    icon: Eye,
    title: 'Unfiltered Pastoral Oversight',
    desc: 'See the true pulse of your church across all campuses without relying on delayed weekly spreadsheets.',
  },
  {
    icon: Sparkles,
    title: 'AI Sermon Repurposing',
    desc: 'Turn a single Sunday sermon recording or transcript into 5 devotional readings, discussion guides, and social quotes in seconds.',
  },
  {
    icon: Shield,
    title: 'Delegation with Peace of Mind',
    desc: 'Equip department leaders and workers with access strictly restricted to their assigned responsibilities.',
  },
  {
    icon: HeartHandshake,
    title: 'Pastoral Care & Prayer Queue',
    desc: 'Never let a member facing illness or bereavement slip through the cracks. Automatically route prayer needs to intercessors.',
  },
]

export function PastorsSection() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden w-full max-w-full">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl sm:rounded-3xl border border-brand-500/30 bg-gradient-to-br from-card via-brand-500/5 to-card p-4 sm:p-8 md:p-14 shadow-xl relative overflow-hidden w-full">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Crown className="h-3.5 w-3.5" />
              <span>For Senior Pastors &amp; Ministry Leaders</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
              Built for the People Leading the Ministry.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              You were called to shepherd souls and minister the Word, not spend 30 hours a week struggling with administrative chaos and fragmented spreadsheets.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PASTORAL_BENEFITS.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 space-y-3 shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all"
                >
                  <div className="h-11 w-11 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-2xs">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
