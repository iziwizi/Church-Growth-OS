'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  MessageSquare,
  Zap,
  Radio,
  BookOpen,
  DollarSign,
  Heart,
  ShoppingBag,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All 12 Modules' },
  { id: 'people', label: 'People & Care' },
  { id: 'comms', label: 'Comms & Operations' },
  { id: 'growth', label: 'Growth & Intelligence' },
]

const CORE_MODULES = [
  {
    icon: Users,
    category: 'people',
    title: 'Members & Discipleship',
    desc: 'Centralized directory, spiritual milestones, household grouping, worker departments, and custom role tags.',
    badge: 'Core CRM',
  },
  {
    icon: UserPlus,
    category: 'people',
    title: 'First-Time Visitors',
    desc: 'Seamless digital visitor registration, automated 7-day retention tracks, follow-up worker assignment, and conversion tracking.',
    badge: 'Growth Engine',
  },
  {
    icon: MessageSquare,
    category: 'comms',
    title: 'Multi-Channel Communications',
    desc: 'Unified WhatsApp Meta Cloud, Resend verified email, and SMS broadcasts to departments or whole church.',
    badge: 'Outreach',
  },
  {
    icon: Zap,
    category: 'growth',
    title: 'Automation & Approval Engine',
    desc: 'Autonomous and safety-approval modes for visitor follow-ups, birthday wishes, and attendance triggers.',
    badge: 'Automation',
  },
  {
    icon: Radio,
    category: 'comms',
    title: 'Live Service Control Room',
    desc: 'Multi-platform live stream preflight check, YouTube/Facebook destination routing, and broadcast promotions.',
    badge: 'Production',
  },
  {
    icon: BookOpen,
    category: 'growth',
    title: 'Sermons & Media Repository',
    desc: 'Audio sermon uploads, series metadata, topic categorization, and automatic AI transcript repurposing.',
    badge: 'Media',
  },
  {
    icon: DollarSign,
    category: 'comms',
    title: 'Giving & Financial Ledgers',
    desc: 'Centralized tithes, offerings, pledge campaigns, Paystack/Flutterwave/Stripe links, and direct bank reconciliation.',
    badge: 'Finance',
  },
  {
    icon: Heart,
    category: 'people',
    title: 'Prayer & Testimonies',
    desc: 'Confidential prayer intake, intercessory routing, answered prayer logs, and moderation of praise reports.',
    badge: 'Pastoral Care',
  },
  {
    icon: ShoppingBag,
    category: 'comms',
    title: 'Church Store & Digital Resources',
    desc: 'Sell ministry books, sermon downloads, worship audio tracks, and conference tickets directly.',
    badge: 'E-Commerce',
  },
  {
    icon: Sparkles,
    category: 'growth',
    title: 'AI Studio & Content Suite',
    desc: 'Transform raw sermon audios and notes into devotional summaries, discussion guides, and social posts.',
    badge: 'AI Copilot',
  },
  {
    icon: BarChart3,
    category: 'growth',
    title: 'Reports & Executive Analytics',
    desc: 'Daily 6:00 AM automated pastoral briefings, attendance velocity charts, and financial health trends.',
    badge: 'Analytics',
  },
  {
    icon: Calendar,
    category: 'people',
    title: 'Events & Volunteer Rosters',
    desc: 'Church calendar, event registrations, QR ticketing, and automated reminder broadcasts.',
    badge: 'Events',
  },
]

export function CoreFeatures() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules =
    activeCategory === 'all'
      ? CORE_MODULES
      : CORE_MODULES.filter((m) => m.category === activeCategory)

  return (
    <section id="features" className="py-24 sm:py-32 relative">
      {/* Background Ambient Accents */}
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-brand-500/10 blur-[150px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Layers className="h-3.5 w-3.5" />
            <span>Complete Ministry Platform</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            12 Integrated Modules Built Specifically for Ministry.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every department in your church operates from one unified database with custom role-based permissions.
          </p>

          {/* Interactive Category Filter Tabs */}
          <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-105'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Feature Cards Grid with Smooth Layout Animation */}
        <motion.div
          layout
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredModules.map((module) => {
              const Icon = module.icon
              return (
                <motion.div
                  layout
                  key={module.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-7 space-y-4 shadow-sm hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/40">
                        {module.badge}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {module.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
