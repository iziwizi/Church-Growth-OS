'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Building2, Users, DollarSign, Loader2, Cpu, CheckCircle2 } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

// Pricing (must match admin/pricing-plans config)
const PLAN_PRICES_NGN: Record<string, number> = {
  starter: 45000,
  growth: 120000,
  enterprise: 350000,
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalChurches: 0,
    totalUsers: 0,
    paidChurches: 0,
    trialChurches: 0,
    mrrNgn: 0,
    arrNgn: 0,
    churnRate: 0,
    totalPeople: 0,
    canceledChurches: 0,
  })

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const [churchSnap, userSnap] = await Promise.all([
          getDocs(collection(db, 'churches')).catch(() => null),
          getDocs(collection(db, 'users')).catch(() => null),
        ])

        const churches = churchSnap?.docs.map((d) => ({ id: d.id, ...d.data() as any })) ?? []
        const totalUsers = userSnap?.size ?? 0

        let mrrNgn = 0
        let paidChurches = 0
        let trialChurches = 0
        let canceledChurches = 0

        churches.forEach((c: any) => {
          const status = c.subscription?.status ?? 'trialing'
          const planId = c.subscription?.planId ?? c.plan ?? 'free_trial'

          if (status === 'trialing' || planId === 'free_trial') {
            trialChurches++
          } else if (status === 'canceled') {
            canceledChurches++
          } else if (status === 'active') {
            paidChurches++
            const planKey = planId.replace('_', '').toLowerCase()
            mrrNgn += PLAN_PRICES_NGN[planKey] ?? PLAN_PRICES_NGN.starter!
          }
        })

        const arrNgn = mrrNgn * 12
        const totalChurches = churches.length
        // Churn = canceled / (total - trial) × 100, clamped to 0 if no paid history
        const base = paidChurches + canceledChurches
        const churnRate = base > 0 ? Math.round((canceledChurches / base) * 100 * 10) / 10 : 0

        // Count total people across all churches (best-effort)
        let totalPeople = 0
        for (const c of churches.slice(0, 10)) {
          // Limit to 10 churches to avoid too many reads on analytics page
          const pSnap = await getDocs(collection(db, 'churches', c.id, 'people')).catch(() => null)
          totalPeople += pSnap?.size ?? 0
        }

        setMetrics({
          totalChurches,
          totalUsers,
          paidChurches,
          trialChurches,
          mrrNgn,
          arrNgn,
          churnRate,
          totalPeople,
          canceledChurches,
        })
      } catch (err) {
        console.error('Analytics load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  const fmtNgn = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Growth Analytics
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          SaaS subscription growth, MRR, ARR, and active church retention metrics. All data read live from Firestore.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Monthly Recurring Revenue</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {metrics.mrrNgn > 0 ? fmtNgn(metrics.mrrNgn) : '₦0'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.paidChurches} paid {metrics.paidChurches === 1 ? 'church' : 'churches'}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Annual Run Rate (ARR)</span>
                <TrendingUp className="h-4 w-4 text-brand-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {metrics.arrNgn > 0 ? fmtNgn(metrics.arrNgn) : '₦0'}
              </p>
              <p className="text-[11px] text-muted-foreground">MRR × 12</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Net Customer Churn</span>
                <Activity className="h-4 w-4 text-rose-500" />
              </div>
              <p className={`font-display text-2xl font-bold ${metrics.churnRate === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {metrics.churnRate}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.canceledChurches} canceled accounts
              </p>
            </div>
          </div>

          {/* Church & User Counts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Total Churches</span>
                <Building2 className="h-4 w-4 text-brand-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{metrics.totalChurches}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Platform Users</span>
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{metrics.totalUsers}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">Trial Churches</span>
                <Cpu className="h-4 w-4 text-amber-500" />
              </div>
              <p className="font-display text-2xl font-bold text-amber-500">{metrics.trialChurches}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold">People Profiles</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{metrics.totalPeople.toLocaleString()}+</p>
              <p className="text-[10px] text-muted-foreground">First 10 churches sampled</p>
            </div>
          </div>

          {/* Tenant Breakdown */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              Tenant Lifecycle Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Active (Paid)', count: metrics.paidChurches, pct: metrics.totalChurches > 0 ? Math.round((metrics.paidChurches / metrics.totalChurches) * 100) : 0, color: 'bg-emerald-500' },
                { label: 'Trialing (Free)', count: metrics.trialChurches, pct: metrics.totalChurches > 0 ? Math.round((metrics.trialChurches / metrics.totalChurches) * 100) : 0, color: 'bg-amber-500' },
                { label: 'Canceled', count: metrics.canceledChurches, pct: metrics.totalChurches > 0 ? Math.round((metrics.canceledChurches / metrics.totalChurches) * 100) : 0, color: 'bg-rose-500' },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">{row.label}</span>
                    <span className="text-muted-foreground">{row.count} ({row.pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${row.color} transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
