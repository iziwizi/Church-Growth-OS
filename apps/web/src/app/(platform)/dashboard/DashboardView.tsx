'use client'

import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
  Bot,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useChurchStore, useAuthStore } from '@/store'
import { formatNumber } from '@/lib/utils'

// ── Mock data (will be replaced with real Firestore queries) ──────────────────

const GROWTH_DATA = [
  { month: 'Mar', members: 210, visitors: 45 },
  { month: 'Apr', members: 235, visitors: 58 },
  { month: 'May', members: 252, visitors: 71 },
  { month: 'Jun', members: 278, visitors: 66 },
  { month: 'Jul', members: 295, visitors: 82 },
  { month: 'Aug', members: 318, visitors: 94 },
]

const AI_COMPLETED_TODAY = [
  { id: '1', type: 'declaration', text: 'Morning declaration sent to 312 members', time: '6:00 AM', icon: '🌅' },
  { id: '2', type: 'bible_verse', text: 'Daily Bible verse broadcast sent', time: '7:00 AM', icon: '📖' },
  { id: '3', type: 'birthday', text: 'Birthday wish sent to 3 members', time: '8:00 AM', icon: '🎂' },
  { id: '4', type: 'follow_up', text: '5 visitor follow-up messages sent', time: '9:30 AM', icon: '🤝' },
  { id: '5', type: 'sermon', text: 'Last Sunday sermon repurposed for social media', time: '10:00 AM', icon: '✨' },
  { id: '6', type: 'reminder', text: 'Sunday service reminder queued for 5 PM', time: '11:00 AM', icon: '⛪' },
]

const STAT_CARDS = [
  {
    label: 'Total Members',
    value: '318',
    change: '+23',
    trend: 'up',
    icon: Users,
    color: 'text-brand-600',
    bg: 'bg-brand-50 dark:bg-brand-950/30',
  },
  {
    label: 'Visitors This Month',
    value: '94',
    change: '+12',
    trend: 'up',
    icon: UserPlus,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    label: 'Donations (This Month)',
    value: '₦2.4M',
    change: '+18%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-gold-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    label: 'AI Actions Today',
    value: '6',
    change: 'Autonomous',
    trend: 'neutral',
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
]

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Dashboard View ────────────────────────────────────────────────────────────

export function DashboardView() {
  const { user } = useAuthStore()
  const { church } = useChurchStore()

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.displayName?.split(' ')[0] ?? 'Pastor'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <h1 className="page-title">
            {greeting}, {firstName} 👋
          </h1>
          <p className="page-description">
            Here&apos;s what your AI has accomplished today —{' '}
            <span className="font-medium text-brand-600 dark:text-brand-400">
              {church?.name ?? 'your church'}
            </span>{' '}
            is growing automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="ai-badge">
            <Bot className="h-3 w-3" />
            <span>AI Autonomous Mode</span>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Growth Chart */}
        <motion.div variants={itemVariants} className="xl:col-span-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Church Growth
                </h2>
                <p className="text-sm text-muted-foreground">Members & visitors over 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  Members
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Visitors
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={GROWTH_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="membersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="members"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={2}
                  fill="url(#membersGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="hsl(160, 60%, 45%)"
                  strokeWidth={2}
                  fill="url(#visitorsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Daily Mission */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">
                  AI Completed Today
                </h2>
                <p className="text-xs text-muted-foreground">Autonomous mission log</p>
              </div>
            </div>
            <div className="divide-y">
              {AI_COMPLETED_TODAY.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="mt-0.5 text-base leading-none">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </p>
                  </div>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Next action</span>
                <span className="flex items-center gap-1 font-medium text-brand-600">
                  <Zap className="h-3 w-3" />
                  Service reminder @ 5:00 PM
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={itemVariants}>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-display text-sm font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Send Broadcast', icon: MessageSquare, href: '/communications' },
              { label: 'Add Member', icon: Users, href: '/members?action=add' },
              { label: 'Generate Content', icon: Sparkles, href: '/ai-studio' },
              { label: 'View Reports', icon: TrendingUp, href: '/reports' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm"
                >
                  <Icon className="h-5 w-5 text-brand-600" />
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
