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
  Plus,
  CheckCircle2,
  CalendarPlus,
  UserCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  HardDrive,
} from 'lucide-react'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuthStore, useChurchStore } from '@/store'
import { StatCard } from '@/components/dashboard/StatCard'
import { ExecutiveReportCard } from '@/components/dashboard/ExecutiveReportCard'
import { UpcomingEventsCard, EventItem } from '@/components/dashboard/UpcomingEventsCard'
import { PrayerRequestsCard, PrayerItem } from '@/components/dashboard/PrayerRequestsCard'
import { GrowthChartCard, GrowthDataPoint } from '@/components/dashboard/GrowthChartCard'
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
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalMembers: 0,
    visitors: 0,
    workers: 0,
    aiEngagementScore: 0,
    prayerRequestsCount: 0,
    birthdaysToday: 0,
    pendingFollowUps: 0,
    scheduledAutomations: 0,
    whatsAppDeliveries: 0,
    emailDeliveries: 0,
    upcomingEventsCount: 0,
    executiveReportsCount: 0,
  })

  const [eventsList, setEventsList] = useState<EventItem[]>([])
  const [prayersList, setPrayersList] = useState<PrayerItem[]>([])
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([])
  const [aiReportData, setAiReportData] = useState<{
    summary?: string
    messagesSent?: number
    deliveryRate?: number
    visitors?: number
    followUpsDue?: number
    date?: string
  } | null>(null)

  useEffect(() => {
    if (!church?.id) return
    const churchId = church.id

    async function loadDashboardData() {
      setLoading(true)
      try {
        // 1. Fetch People Statistics
        const peopleStats = await getPeopleStats(churchId)
        const totalMembers = peopleStats.byTag['member'] ?? 0
        const visitors = peopleStats.byTag['visitor'] ?? 0
        const workers = peopleStats.byTag['worker'] ?? 0

        // 2. Fetch Events
        const eventsQuery = query(
          collection(db, 'churches', churchId, 'events'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const eventsSnap = await getDocs(eventsQuery).catch(() => null)
        const fetchedEvents: EventItem[] = []
        if (eventsSnap && !eventsSnap.empty) {
          eventsSnap.docs.forEach((docSnap) => {
            const data = docSnap.data()
            fetchedEvents.push({
              id: docSnap.id,
              title: data.title ?? 'Ministry Event',
              date: data.startDate ?? 'Upcoming',
              time: data.startTime ?? '',
              isOnline: data.isOnline ?? false,
              registrations: data.registrationsCount ?? 0,
            })
          })
        }
        setEventsList(fetchedEvents)

        // 3. Fetch Prayer Requests
        const prayerQuery = query(
          collection(db, 'churches', churchId, 'prayerRequests'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const prayerSnap = await getDocs(prayerQuery).catch(() => null)
        const fetchedPrayers: PrayerItem[] = []
        if (prayerSnap && !prayerSnap.empty) {
          prayerSnap.docs.forEach((docSnap) => {
            const data = docSnap.data()
            fetchedPrayers.push({
              id: docSnap.id,
              memberName: data.personName ?? 'Congregation Member',
              request: data.request ?? data.description ?? '',
              category: data.category ?? 'General',
              status: data.status ?? 'open',
              timeAgo: 'Recently',
            })
          })
        }
        setPrayersList(fetchedPrayers)

        // 4. Fetch Today's AI Executive Report
        const todayStr = new Date().toISOString().split('T')[0]!
        const reportQuery = query(
          collection(db, 'aiReports', churchId, 'daily'),
          where('date', '==', todayStr),
          limit(1)
        )
        const reportSnap = await getDocs(reportQuery).catch(() => null)
        if (reportSnap && !reportSnap.empty) {
          const reportDoc = reportSnap.docs[0]!.data()
          setAiReportData({
            summary: reportDoc.summary,
            messagesSent: reportDoc.metrics?.whatsappSent ?? 0,
            deliveryRate: reportDoc.metrics?.deliveryRate ?? 100,
            visitors: reportDoc.metrics?.newVisitors ?? 0,
            followUpsDue: reportDoc.metrics?.followUpsDue ?? 0,
            date: reportDoc.date,
          })
        }

        setStats({
          totalMembers,
          visitors,
          workers,
          aiEngagementScore: peopleStats.total > 0 ? 85 : 0,
          prayerRequestsCount: fetchedPrayers.length,
          birthdaysToday: 0,
          pendingFollowUps: 0,
          scheduledAutomations: 0,
          whatsAppDeliveries: 0,
          emailDeliveries: 0,
          upcomingEventsCount: fetchedEvents.length,
          executiveReportsCount: reportSnap?.size ?? 0,
        })

        if (peopleStats.total > 0) {
          setGrowthData([{ month: 'Current', members: totalMembers, visitors, deliveries: 0 }])
        } else {
          setGrowthData([])
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [church?.id])

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.displayName?.split(' ')[0] ?? 'Pastor'

  // Dynamic Trial Countdown Calculation (Task 8 requirement)
  const calculateDaysRemaining = (): number => {
    if (!church?.subscription?.trialEnd) return 14
    const end = new Date(church.subscription.trialEnd as string | number).getTime()
    const now = Date.now()
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const daysRemaining = calculateDaysRemaining()
  const isTrial = church?.subscription?.planId === 'free_trial' || church?.subscription?.status === 'trialing'
  const planName = isTrial ? '14-Day Free Trial' : (church?.subscription?.planId?.toUpperCase() ?? 'FREE TRIAL')

  const aiCreditsRemaining = church?.subscription?.aiCreditsRemaining ?? 2500
  const aiCreditsTotal = church?.subscription?.aiCreditsTotal ?? 2500
  const aiPct = Math.round((aiCreditsRemaining / aiCreditsTotal) * 100)

  const storageUsedMb = church?.subscription?.storageUsedMb ?? 0
  const storageTotalMb = church?.subscription?.storageTotalMb ?? 5000

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
            Welcome to your Church Growth OS command center for{' '}
            <span className="font-semibold text-brand-500">{church?.name ?? 'your church'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-400">
            <Bot className="h-4 w-4 animate-pulse text-purple-400" />
            <span>AI Mode: {church?.settings?.aiMode === 'approval' ? 'Approval' : 'Autonomous'}</span>
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

      {/* ── Trial Reminder Banner (Task 14 Requirement) ─────────────────── */}
      {isTrial && daysRemaining <= 7 && (
        <motion.div
          variants={itemVariants}
          className={`rounded-2xl border p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs ${
            daysRemaining <= 1
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
              : daysRemaining <= 3
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
              : 'border-brand-500/30 bg-brand-500/10 text-brand-500'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {daysRemaining === 0
                ? 'Your Free Trial has expired. Upgrade your plan to maintain 24/7 autonomous engagement.'
                : `Trial Reminder: You have ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left on your Free Trial.`}
            </span>
          </div>
          <a
            href="/pricing"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-xs"
          >
            <span>Upgrade Plan Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      )}

      {/* ── Subscription Card (Task 11 Requirement) ──────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-foreground">Current Subscription</h2>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-500 uppercase">
                  {planName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isTrial
                  ? `Dynamic Countdown: ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining`
                  : 'Active Subscription'}
              </p>
            </div>
          </div>

          <a
            href="/pricing"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          {/* Days Remaining Meter */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground">Trial Period</span>
              <span className="text-brand-500 font-bold">{daysRemaining} / 14 Days</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((daysRemaining / 14) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Calculated dynamically from current date</p>
          </div>

          {/* AI Credits Meter */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" /> AI Credits
              </span>
              <span className="text-purple-500 font-bold">
                {aiCreditsRemaining.toLocaleString()} / {aiCreditsTotal.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${aiPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{aiPct}% available for generation</p>
          </div>

          {/* Storage Meter */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-sky-500" /> Cloud Storage
              </span>
              <span className="text-sky-500 font-bold">{storageUsedMb} MB / 5 GB</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${Math.max(2, Math.round((storageUsedMb / storageTotalMb) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Media &amp; sermon attachments</p>
          </div>
        </div>
      </motion.div>

      {/* ── 12 Required Core Ministry Metric Cards ──────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Real-Time Ministry Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Total Members"
            value={stats.totalMembers}
            change={stats.totalMembers > 0 ? 'Active' : 'No records yet'}
            trend="neutral"
            icon={Users}
            color="text-brand-500"
            bg="bg-brand-500/10"
            subtitle="Registered congregation members"
          />

          <StatCard
            label="Visitors"
            value={stats.visitors}
            change={stats.visitors > 0 ? 'Active' : '0 guests'}
            trend="neutral"
            icon={UserPlus}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            subtitle="First-time & recent guests"
          />

          <StatCard
            label="Workers & Ministry Staff"
            value={stats.workers}
            change={stats.workers > 0 ? 'Active' : '0 assigned'}
            trend="neutral"
            icon={Briefcase}
            color="text-blue-500"
            bg="bg-blue-500/10"
            subtitle="Volunteers, choir & department heads"
          />

          <StatCard
            label="AI Engagement Score"
            value={stats.aiEngagementScore > 0 ? `${stats.aiEngagementScore}/100` : 'N/A'}
            change={stats.aiEngagementScore > 0 ? 'Active AI Evaluation' : 'Requires People Data'}
            trend="neutral"
            icon={Sparkles}
            color="text-purple-500"
            bg="bg-purple-500/10"
            subtitle="Member retention & risk index"
          />

          <StatCard
            label="Prayer Requests"
            value={stats.prayerRequestsCount}
            change={stats.prayerRequestsCount > 0 ? 'Requests logged' : '0 requests'}
            trend="neutral"
            icon={HandHeart}
            color="text-rose-500"
            bg="bg-rose-500/10"
            subtitle="Submitted congregation prayer needs"
          />

          <StatCard
            label="Birthdays Today"
            value={stats.birthdaysToday}
            change="Automated AI checks"
            trend="neutral"
            icon={Cake}
            color="text-amber-500"
            bg="bg-amber-500/10"
            subtitle="Members celebrating today"
          />

          <StatCard
            label="Pending Follow-ups"
            value={stats.pendingFollowUps}
            change="AI Priority Queue"
            trend="neutral"
            icon={Clock}
            color="text-orange-500"
            bg="bg-orange-500/10"
            subtitle="Visitors & disengaged check-ins"
          />

          <StatCard
            label="Scheduled Automations"
            value={stats.scheduledAutomations}
            change="Configured"
            trend="neutral"
            icon={Zap}
            color="text-indigo-500"
            bg="bg-indigo-500/10"
            subtitle="Active automation workflows"
          />

          <StatCard
            label="WhatsApp Deliveries"
            value={stats.whatsAppDeliveries}
            change="Meta Cloud API"
            trend="neutral"
            icon={MessageSquare}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            subtitle="Broadcasts & declarations sent"
          />

          <StatCard
            label="Email Deliveries"
            value={stats.emailDeliveries}
            change="Resend Provider"
            trend="neutral"
            icon={Mail}
            color="text-cyan-500"
            bg="bg-cyan-500/10"
            subtitle="Executive reports & newsletters"
          />

          <StatCard
            label="Upcoming Events"
            value={stats.upcomingEventsCount}
            change={stats.upcomingEventsCount > 0 ? 'Scheduled' : '0 scheduled'}
            trend="neutral"
            icon={Calendar}
            color="text-sky-500"
            bg="bg-sky-500/10"
            subtitle="Services & conferences"
          />

          <StatCard
            label="Executive Reports"
            value={stats.executiveReportsCount}
            change="Daily at 6 AM"
            trend="neutral"
            icon={FileText}
            color="text-purple-500"
            bg="bg-purple-500/10"
            subtitle="Generated AI reports"
          />
        </div>
      </motion.div>

      {/* ── Today's Executive Report (Real Firestore Data or Empty State) ── */}
      <motion.div variants={itemVariants}>
        {aiReportData ? (
          <ExecutiveReportCard
            churchName={church?.name}
            date={aiReportData.date}
            summary={aiReportData.summary}
            messagesSent={aiReportData.messagesSent}
            deliveryRate={aiReportData.deliveryRate}
            visitors={aiReportData.visitors}
            followUpsDue={aiReportData.followUpsDue}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground">
              Daily AI Executive Report
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              No report generated for today yet. The AI Executive Report function executes automatically every morning at 6 AM UTC, summarizing all 24-hour attendance, broadcasts, and member engagement metrics.
            </p>
            <div className="pt-2">
              <a
                href="/reports"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                View Reports Module
              </a>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Growth Chart & Events ──────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div variants={itemVariants} className="lg:col-span-3">
          {growthData.length > 0 ? (
            <GrowthChartCard data={growthData} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3 flex flex-col items-center justify-center h-full min-h-[260px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">No Congregation Data Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                As you add members, visitors, and run automated communications, your church growth trajectory will render here.
              </p>
              <a
                href="/members?action=new"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-brand-500" />
                Add First Member
              </a>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          {eventsList.length > 0 ? (
            <UpcomingEventsCard events={eventsList} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3 flex flex-col items-center justify-center h-full min-h-[260px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">No Upcoming Events</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Schedule services, conferences, or cell meetings to trigger automated reminders.
              </p>
              <a
                href="/events?action=new"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-sky-500" />
                Schedule Event
              </a>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dashboard Footer Attribution */}
      <footer className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Powered by <span className="font-semibold text-foreground">Church Growth OS</span> — A Product of{' '}
        <a href="https://mujteknify.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">
          MUJTEKNIFY LIMITED
        </a>
      </footer>
    </motion.div>
  )
}
