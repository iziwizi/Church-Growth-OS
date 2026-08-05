'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Sparkles, TrendingUp, Users, UserCheck, HandHeart, DollarSign, Loader2 } from 'lucide-react'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { generateExecutiveReportPDF } from '@/lib/reports/generatePDF'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { church } = useChurchStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    membersCount: 0,
    visitorsCount: 0,
    workersCount: 0,
    prayerRequestsCount: 0,
    sermonsCount: 0,
    givingTotal: 0,
    donationsCount: 0,
    automationsActive: 0,
    partnershipsCount: 0,
  })
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [recentMembers, setRecentMembers] = useState<any[]>([])

  useEffect(() => {
    if (!church?.id) return
    loadReportData()
  }, [church?.id])

  async function loadReportData() {
    if (!church?.id) return
    setLoading(true)
    try {
      const churchId = church.id

      // People stats
      const peopleSnap = await getDocs(collection(db, 'churches', churchId, 'people')).catch(() => null)
      let members = 0, visitors = 0, workers = 0
      if (peopleSnap && !peopleSnap.empty) {
        peopleSnap.docs.forEach((d) => {
          const tags: string[] = d.data().tags ?? []
          if (tags.includes('member')) members++
          if (tags.includes('visitor')) visitors++
          if (tags.includes('worker')) workers++
        })
      }

      // Visitor records
      const visitorsSnap = await getDocs(collection(db, 'churches', churchId, 'visitors')).catch(() => null)
      const visitorsCount = (visitorsSnap?.size ?? 0) + visitors

      // Prayer requests
      const prayerSnap = await getDocs(collection(db, 'churches', churchId, 'prayerRequests')).catch(() => null)

      // Sermons
      const sermonsSnap = await getDocs(collection(db, 'churches', churchId, 'sermons')).catch(() => null)

      // Donations
      const donationsSnap = await getDocs(collection(db, 'churches', churchId, 'donations')).catch(() => null)
      let givingTotal = 0
      const recentDonationsList: any[] = []
      if (donationsSnap && !donationsSnap.empty) {
        donationsSnap.docs.forEach((d) => {
          const data = d.data()
          givingTotal += Number(data.amount ?? 0)
          recentDonationsList.push({ id: d.id, ...data })
        })
      }
      setRecentDonations(recentDonationsList.slice(0, 5))

      // Automations
      const autoSnap = await getDocs(
        query(collection(db, 'churches', churchId, 'automations'), where('status', '==', 'active'))
      ).catch(() => null)

      // Partnerships
      const partSnap = await getDocs(collection(db, 'churches', churchId, 'partnerships')).catch(() => null)

      // Recent members
      const recentMembersSnap = await getDocs(
        query(collection(db, 'churches', churchId, 'people'), orderBy('createdAt', 'desc'), limit(5))
      ).catch(() => null)
      const recentMembersList: any[] = []
      if (recentMembersSnap && !recentMembersSnap.empty) {
        recentMembersSnap.docs.forEach((d) => recentMembersList.push({ id: d.id, ...d.data() }))
      }
      setRecentMembers(recentMembersList)

      setStats({
        membersCount: members,
        visitorsCount: visitorsCount,
        workersCount: workers,
        prayerRequestsCount: prayerSnap?.size ?? 0,
        sermonsCount: sermonsSnap?.size ?? 0,
        givingTotal,
        donationsCount: donationsSnap?.size ?? 0,
        automationsActive: autoSnap?.size ?? 0,
        partnershipsCount: partSnap?.size ?? 0,
      })
    } catch (err) {
      console.error('Error loading report data:', err)
      toast.error('Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    const visitorRetentionPct = stats.visitorsCount > 0
      ? Math.min(100, Math.round((stats.membersCount / (stats.visitorsCount + stats.membersCount)) * 100))
      : 0

    generateExecutiveReportPDF({
      churchName: church?.name ?? 'Grace Church',
      logoUrl: church?.branding?.logoUrl,
      date: new Date().toLocaleDateString(),
      summary:
        `1. Congregation: ${stats.membersCount} members, ${stats.visitorsCount} visitor records, ${stats.workersCount} workers.\n` +
        `2. Financial Giving: Total contributions of ₦${stats.givingTotal.toLocaleString()} across ${stats.donationsCount} transactions.\n` +
        `3. Ministry: ${stats.sermonsCount} sermons archived, ${stats.prayerRequestsCount} prayer requests logged.\n` +
        `4. Automation: ${stats.automationsActive} active workflow(s) running 24/7.\n` +
        `5. Partnerships: ${stats.partnershipsCount} covenant partner(s) registered.`,
      visitorsCount: stats.visitorsCount,
      membersCount: stats.membersCount,
      givingTotal: stats.givingTotal,
    })
    toast.success('Executive PDF Report generated!')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total Members', value: stats.membersCount, icon: Users, color: 'text-brand-500 bg-brand-500/10' },
    { label: 'Visitor Records', value: stats.visitorsCount, icon: UserCheck, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Prayer Requests', value: stats.prayerRequestsCount, icon: HandHeart, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Total Giving (₦)', value: `₦${stats.givingTotal.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Sermons Archived', value: stats.sermonsCount, icon: BarChart3, color: 'text-sky-500 bg-sky-500/10' },
    { label: 'Active Automations', value: stats.automationsActive, icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Intelligence &amp; Growth Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Real-time ministry health reports for senior leadership of {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
        >
          <Download className="h-4 w-4" /> Download PDF Summary
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{card.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI Summary */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> Executive Report — {new Date().toLocaleDateString()}
          </h2>

          <div className="rounded-xl border bg-muted/20 p-5 space-y-3 text-xs leading-relaxed">
            <p className="font-bold text-foreground">Ministry Overview</p>
            <p>
              1. <strong>Congregation:</strong> {stats.membersCount} registered members across all branches.{' '}
              {stats.visitorsCount} visitor records tracked for follow-up engagement.
            </p>
            <p>
              2. <strong>Financial Giving:</strong> Total contributions of{' '}
              <strong>₦{stats.givingTotal.toLocaleString()}</strong> recorded across {stats.donationsCount}{' '}
              transactions.
            </p>
            <p>
              3. <strong>Ministry Activity:</strong> {stats.sermonsCount} sermons archived.{' '}
              {stats.prayerRequestsCount} prayer requests logged and tracked.
            </p>
            <p>
              4. <strong>Automation Engine:</strong> {stats.automationsActive} active workflow(s) running 24/7 for
              visitor sequences, birthday greetings, and engagement.
            </p>
            <p>
              5. <strong>Kingdom Partnerships:</strong> {stats.partnershipsCount} covenant partner(s) registered.
            </p>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Ministry Metrics</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total Members</span>
              <span className="font-bold text-brand-500">{stats.membersCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Workers / Leaders</span>
              <span className="font-bold text-purple-500">{stats.workersCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Visitor Records</span>
              <span className="font-bold text-sky-500">{stats.visitorsCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Donations Total</span>
              <span className="font-bold text-emerald-500">₦{stats.givingTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Prayer Requests</span>
              <span className="font-bold text-rose-500">{stats.prayerRequestsCount}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Active Automations</span>
              <span className="font-bold text-amber-500">{stats.automationsActive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      {recentMembers.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-sm font-bold text-foreground">Recently Added Members</h2>
          </div>
          <div className="divide-y divide-border text-xs">
            {recentMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3.5 hover:bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 font-bold text-sm">
                    {m.fullName?.charAt(0)?.toUpperCase() ?? 'M'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{m.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{m.email || m.phone || 'No contact'}</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-500 capitalize">
                  {m.tags?.[0] ?? 'member'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
