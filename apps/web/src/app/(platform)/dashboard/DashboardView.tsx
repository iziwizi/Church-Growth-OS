'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Briefcase,
  Sparkles,
  HandHeart,
  Cake,
  Clock,
  Zap,
  MessageSquare,
  Mail,
  Bot,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { useAuthStore, useChurchStore } from '@/store'
import { StatCard } from '@/components/dashboard/StatCard'
import { ExecutiveReportCard } from '@/components/dashboard/ExecutiveReportCard'
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard'
import { PrayerRequestsCard } from '@/components/dashboard/PrayerRequestsCard'
import { GrowthChartCard } from '@/components/dashboard/GrowthChartCard'
import { getPeopleStats } from '@/lib/people/PeopleService'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function DashboardView() {
  const { user } = useAuthStore()
  const { church } = useChurchStore()
  const [stats, setStats] = useState({
    totalMembers: 318,
    visitors: 94,
    workers: 42,
    aiEngagementScore: 92,
    prayerRequests: 14,
    birthdaysToday: 3,
    pendingFollowUps: 5,
    scheduledAutomations: 12,
    whatsAppDeliveries: 2840,
    emailDeliveries: 1920,
  })

  useEffect(() => {
    if (church?.id) {
      getPeopleStats(church.id)
        .then((res) => {
          if (res.total > 0) {
            setStats((prev) => ({
              ...prev,
              totalMembers: res.byTag['member'] ?? prev.totalMembers,
              visitors: res.byTag['visitor'] ?? prev.visitors,
              workers: res.byTag['worker'] ?? prev.workers,
            }))
          }
        })
        .catch(() => {
          // Gracefully fallback to demo numbers
        })
    }
  }, [church?.id])

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.displayName?.split(' ')[0] ?? 'Pastor'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* ── Page Header & Welcome Banner ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your daily command center for{' '}
            <span className="font-semibold text-brand-500">
              {church?.name ?? 'Grace Fellowship Church'}
            </span>
            . AI is actively engaging your congregation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-400">
            <Bot className="h-4 w-4 animate-pulse text-purple-400" />
            <span>AI Autonomous Engine Active</span>
          </div>
          <a
            href="/members?action=new"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Person
          </a>
        </div>
      </motion.div>

      {/* ── 12 Required Dashboard Cards (Grid 1) ───────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Core Ministry Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 1. Total Members */}
          <StatCard
            label="Total Members"
            value={stats.totalMembers}
            change="+18 this month"
            trend="up"
            icon={Users}
            color="text-brand-500"
            bg="bg-brand-500/10"
            subtitle="Active congregation members"
          />

          {/* 2. Visitors */}
          <StatCard
            label="Visitors"
            value={stats.visitors}
            change="+12 this week"
            trend="up"
            icon={UserPlus}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            subtitle="First-time & recent guests"
          />

          {/* 3. Workers */}
          <StatCard
            label="Workers & Ministry Staff"
            value={stats.workers}
            change="Active"
            trend="neutral"
            icon={Briefcase}
            color="text-blue-500"
            bg="bg-blue-500/10"
            subtitle="Volunteers, choir & leaders"
          />

          {/* 4. AI Engagement Score */}
          <StatCard
            label="AI Engagement Score"
            value={`${stats.aiEngagementScore}/100`}
            change="High engagement"
            trend="up"
            icon={Sparkles}
            color="text-purple-500"
            bg="bg-purple-500/10"
            subtitle="Automated retention index"
          />

          {/* 5. Prayer Requests */}
          <StatCard
            label="Prayer Requests"
            value={stats.prayerRequests}
            change="3 open"
            trend="neutral"
            icon={HandHeart}
            color="text-rose-500"
            bg="bg-rose-500/10"
            subtitle="Submitted by members"
          />

          {/* 6. Birthdays Today */}
          <StatCard
            label="Birthdays Today"
            value={stats.birthdaysToday}
            change="AI messages sent"
            trend="up"
            icon={Cake}
            color="text-amber-500"
            bg="bg-amber-500/10"
            subtitle="Celebrations today"
          />

          {/* 7. Pending Follow-ups */}
          <StatCard
            label="Pending Follow-ups"
            value={stats.pendingFollowUps}
            change="2 urgent"
            trend="down"
            icon={Clock}
            color="text-orange-500"
            bg="bg-orange-500/10"
            subtitle="Visitors & disengaged members"
          />

          {/* 8. Scheduled Automations */}
          <StatCard
            label="Scheduled Automations"
            value={stats.scheduledAutomations}
            change="12 active"
            trend="up"
            icon={Zap}
            color="text-indigo-500"
            bg="bg-indigo-500/10"
            subtitle="Workflows running 24/7"
          />

          {/* 9. WhatsApp Deliveries */}
          <StatCard
            label="WhatsApp Deliveries"
            value={stats.whatsAppDeliveries.toLocaleString()}
            change="98.4% success"
            trend="up"
            icon={MessageSquare}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            subtitle="Broadcasts & declarations"
          />

          {/* 10. Email Deliveries */}
          <StatCard
            label="Email Deliveries"
            value={stats.emailDeliveries.toLocaleString()}
            change="99.1% success"
            trend="up"
            icon={Mail}
            color="text-cyan-500"
            bg="bg-cyan-500/10"
            subtitle="Daily reports & newsletters"
          />

          {/* 11. Upcoming Events Count */}
          <StatCard
            label="Upcoming Events"
            value={3}
            change="340 registered"
            trend="up"
            icon={Calendar}
            color="text-sky-500"
            bg="bg-sky-500/10"
            subtitle="Services & conferences"
          />

          {/* 12. Executive Reports Generated */}
          <StatCard
            label="Executive Reports"
            value="30"
            change="Daily at 6 AM"
            trend="up"
            icon={FileText}
            color="text-purple-500"
            bg="bg-purple-500/10"
            subtitle="AI summary reports"
          />
        </div>
      </motion.div>

      {/* ── Today's Executive Report (Full Preview Card) ────────────────── */}
      <motion.div variants={itemVariants}>
        <ExecutiveReportCard
          churchName={church?.name}
          messagesSent={stats.whatsAppDeliveries}
          visitors={stats.visitors}
          followUpsDue={stats.pendingFollowUps}
        />
      </motion.div>

      {/* ── Mid Section: Growth Chart & Upcoming Events ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <GrowthChartCard />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <UpcomingEventsCard />
        </motion.div>
      </div>

      {/* ── Lower Section: Prayer Requests & AI Completed Actions ───────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <PrayerRequestsCard />
        </motion.div>

        {/* AI Action Log */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs h-full">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    AI Completed Actions Today
                  </h2>
                  <p className="text-xs text-muted-foreground">Autonomous log for past 24 hours</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                6 Tasks Executed
              </span>
            </div>

            <div className="space-y-3">
              {[
                { time: '6:00 AM', text: 'Morning declaration sent to 318 active members via WhatsApp', icon: '🌅' },
                { time: '7:00 AM', text: 'Daily devotional scripture broadcasted to congregation', icon: '📖' },
                { time: '8:00 AM', text: 'Automated birthday blessings sent to 3 celebrating members', icon: '🎂' },
                { time: '9:30 AM', text: '5 visitor follow-up messages dispatched with pastor contact', icon: '🤝' },
                { time: '10:15 AM', text: 'Sunday sermon repurposed into 4 social captions & quotes', icon: '✨' },
                { time: '11:00 AM', text: 'Mid-week service reminder queued for evening broadcast', icon: '⛪' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3 transition-all hover:bg-muted/50 text-xs"
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.text}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{item.time}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
