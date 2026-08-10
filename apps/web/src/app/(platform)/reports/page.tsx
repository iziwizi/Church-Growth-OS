'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Sparkles,
  TrendingUp,
  Users,
  UserCheck,
  HandHeart,
  DollarSign,
  Loader2,
  Clock,
  Send,
  CheckCircle2,
  Mail,
  Smartphone,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore } from '@/store'
import { generateExecutiveReportPDF } from '@/lib/reports/generatePDF'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { church } = useChurchStore()
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [dailyReports, setDailyReports] = useState<any[]>([])

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
    storeOrdersCount: 0,
  })

  useEffect(() => {
    if (!church?.id) return
    loadReportData()
    loadDailyReports()
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

      // Visitors
      const visitorsSnap = await getDocs(collection(db, 'churches', churchId, 'visitors')).catch(() => null)
      const visitorsCount = (visitorsSnap?.size ?? 0) + visitors

      // Prayer requests
      const prayerSnap = await getDocs(collection(db, 'churches', churchId, 'prayerRequests')).catch(() => null)

      // Sermons
      const sermonsSnap = await getDocs(collection(db, 'churches', churchId, 'sermons')).catch(() => null)

      // Donations
      const donationsSnap = await getDocs(collection(db, 'churches', churchId, 'donations')).catch(() => null)
      let givingTotal = 0
      if (donationsSnap && !donationsSnap.empty) {
        donationsSnap.docs.forEach((d) => {
          givingTotal += Number(d.data().amount ?? 0)
        })
      }

      // Store orders
      const ordersSnap = await getDocs(collection(db, 'churches', churchId, 'orders')).catch(() => null)

      // Automations
      const autoSnap = await getDocs(
        query(collection(db, 'churches', churchId, 'automations'), where('status', '==', 'active'))
      ).catch(() => null)

      // Partnerships
      const partSnap = await getDocs(collection(db, 'churches', churchId, 'partnerships')).catch(() => null)

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
        storeOrdersCount: ordersSnap?.size ?? 0,
      })
    } catch (err) {
      console.error('Error loading report data:', err)
      toast.error('Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }

  async function loadDailyReports() {
    if (!church?.id) return
    try {
      const q = query(
        collection(db, 'churches', church.id, 'dailyReports'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setDailyReports(list)
    } catch (err) {
      console.warn('Could not load daily reports:', err)
    }
  }

  const handleGenerateDailyReportNow = async () => {
    if (!church?.id) return
    setGeneratingReport(true)
    try {
      const idToken = await getIdToken()
      const res = await fetch('/api/church/daily-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ churchId: church.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('☀️ 6:00 AM Executive Growth Report generated and dispatched!')
        await loadDailyReports()
      } else {
        toast.error(data.error ?? 'Failed to generate report.')
      }
    } catch (err: any) {
      toast.error(`Report generation failed: ${err.message}`)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleExportPDF = () => {
    generateExecutiveReportPDF({
      churchName: church?.name ?? 'Grace Church',
      logoUrl: church?.branding?.logoUrl,
      date: new Date().toLocaleDateString(),
      summary:
        `1. Congregation: ${stats.membersCount} members, ${stats.visitorsCount} visitor records, ${stats.workersCount} workers.\n` +
        `2. Financial Giving: Total contributions of ₦${stats.givingTotal.toLocaleString()} across ${stats.donationsCount} transactions.\n` +
        `3. Ministry: ${stats.sermonsCount} sermons archived, ${stats.prayerRequestsCount} prayer requests logged.\n` +
        `4. Store & Resources: ${stats.storeOrdersCount} orders placed.\n` +
        `5. Automation: ${stats.automationsActive} active workflow(s) running 24/7.\n` +
        `6. Partnerships: ${stats.partnershipsCount} covenant partner(s) registered.`,
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
    { label: 'Store Orders', value: stats.storeOrdersCount, icon: ShoppingBag, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Active Automations', value: stats.automationsActive, icon: TrendingUp, color: 'text-sky-500 bg-sky-500/10' },
  ]

  const latestReport = dailyReports[0]

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Intelligence &amp; Growth Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Automated 6:00 AM daily briefings and growth telemetry for {church?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDailyReportNow}
            disabled={generatingReport}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {generatingReport ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            )}
            Trigger 6:00 AM Report Now
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
          >
            <Download className="h-4 w-4" /> Download PDF Summary
          </button>
        </div>
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

      {/* Main Grid: Latest Daily Briefing & History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest AI Growth Briefing */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-sm font-bold text-foreground">
                6:00 AM Pastoral Briefing &amp; AI Action Plan
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              <Clock className="h-3 w-3" /> Scheduled Daily (6:00 AM)
            </span>
          </div>

          {latestReport ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3 leading-relaxed">
                <p className="font-bold text-foreground text-xs flex items-center justify-between">
                  <span>Pastoral Executive Insights ({latestReport.date})</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Recipient: {latestReport.recipient?.title} {latestReport.recipient?.name}
                  </span>
                </p>
                <p className="whitespace-pre-wrap text-foreground/90 text-xs">
                  {latestReport.pastoralInsights}
                </p>
              </div>

              {/* Recommended Actions */}
              {latestReport.recommendedActions && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-xs">Strategic Priorities Today:</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {latestReport.recommendedActions.map((act: any, idx: number) => (
                      <a
                        key={idx}
                        href={act.actionUrl}
                        className="rounded-xl border bg-card p-3 hover:border-brand-500/40 transition-colors flex flex-col justify-between space-y-2 group"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs group-hover:text-brand-600">
                              {act.title}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                act.urgency === 'high'
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {act.urgency}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">{act.description}</p>
                        </div>
                        <span className="text-[10px] font-bold text-brand-600 inline-flex items-center gap-1">
                          Take Action <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/10 p-8 text-center space-y-2">
              <Sparkles className="h-6 w-6 text-brand-500 mx-auto" />
              <p className="font-bold text-foreground">No Daily Report Generated Yet</p>
              <p className="text-muted-foreground text-[11px]">
                Click &quot;Trigger 6:00 AM Report Now&quot; above to generate your first executive growth briefing.
              </p>
            </div>
          )}
        </div>

        {/* Historical Briefing Logs */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Delivery History</h2>
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {dailyReports.length === 0 ? (
              <p className="text-muted-foreground text-[11px]">No previous reports dispatched.</p>
            ) : (
              dailyReports.map((rpt) => (
                <div key={rpt.id} className="rounded-xl border bg-muted/10 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">{rpt.date}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Dispatched
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {(rpt.deliveredChannels ?? ['in_app']).map((ch: string, i: number) => (
                      <span key={ch} className="flex items-center gap-1">
                        {i > 0 && <span className="mr-2">•</span>}
                        {ch === 'email' ? <Mail className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                        {ch === 'in_app' ? 'In-App' : ch === 'email' ? 'Email' : ch === 'whatsapp' ? 'WhatsApp' : ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
