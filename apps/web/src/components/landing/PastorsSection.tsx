'use client'

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
    <section className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-br from-card via-brand-500/5 to-card p-8 sm:p-14 shadow-xl">
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
            {PASTORAL_BENEFITS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md p-6 space-y-3 shadow-xs hover:border-brand-500/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
