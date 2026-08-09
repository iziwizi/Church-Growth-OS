'use client'

import {
  Users,
  UserPlus,
  HandHeart,
  Heart,
  BookOpen,
  Calendar,
  DollarSign,
  ShoppingBag,
  HandshakeIcon,
  MessageSquare,
  Radio,
  Zap,
  Sparkles,
  BarChart3,
} from 'lucide-react'

const CORE_MODULES = [
  {
    icon: Users,
    title: 'Members & Discipleship',
    desc: 'Centralized directory, spiritual milestones, household grouping, worker departments, and custom role tags.',
  },
  {
    icon: UserPlus,
    title: 'First-Time Visitors',
    desc: 'QR-code check-ins, automated 7-day retention tracks, follow-up worker assignment, and conversion tracking.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Communications',
    desc: 'Unified WhatsApp Meta Cloud, Resend verified email, and SMS broadcasts to departments or whole church.',
  },
  {
    icon: DollarSign,
    title: 'Donations & Giving',
    desc: 'Multi-channel tithes, offerings, building pledges, Paystack/Flutterwave/Stripe integration, and bank reconciliation.',
  },
  {
    icon: ShoppingBag,
    title: 'Church Store & Resources',
    desc: 'Publish and distribute sermon audios, pastor books, merchandise, event tickets, and digital study guides.',
  },
  {
    icon: BookOpen,
    title: 'Sermons & AI Repurposing',
    desc: 'Upload message transcripts to automatically generate devotional summaries, discussion guides, and social quotes.',
  },
  {
    icon: Radio,
    title: 'Live Service Control Room',
    desc: 'Preflight stream validation, YouTube/Facebook Live destination management, broadcast promo alerts, and engagement logs.',
  },
  {
    icon: HandHeart,
    title: 'Prayer Requests & Care',
    desc: 'Collect congregation prayer needs, route to pastoral intercessory teams, and track answered testimonies.',
  },
  {
    icon: Heart,
    title: 'Testimonies & Stories',
    desc: 'Moderation workflow for member praise reports to inspire the church and share across service bulletins.',
  },
  {
    icon: Calendar,
    title: 'Events & Attendance',
    desc: 'Conference registration, barcode ticketing, multi-session check-in tracking, and automated reminder broadcasts.',
  },
  {
    icon: HandshakeIcon,
    title: 'Partnerships & Kingdom Builders',
    desc: 'Manage ministry partners, recurring missionary pledges, special project updates, and transparent donor reporting.',
  },
  {
    icon: Zap,
    title: 'Automation & Approval Engine',
    desc: 'Intelligent ministry workflows running autonomously or through a human approval safety queue before dispatch.',
  },
]

export function CoreFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-muted/10 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Complete Ministry Suite</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Everything Your Ministry Needs to Grow and Thrive.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Built from the ground up to solve real church challenges. Every module connects to a unified database for seamless pastoral oversight.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.title}
                className="group rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
