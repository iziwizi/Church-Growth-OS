'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Building2, Users, DollarSign, Loader2, Cpu, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

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
    totalAiCreditsConsumed: 0,
    canceledChurches: 0,
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/analytics')
      const data = await res.json()
      if (res.ok && data.success && data.metrics) {
        setMetrics(data.metrics)
      } else {
        toast.error(data.error ?? 'Failed to compute analytics.')
      }
    } catch (err: any) {
      console.error('Analytics load error:', err)
      toast.error(`Analytics load error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fmtNgn = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Growth Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            SaaS subscription growth, MRR, ARR, and active church retention metrics calculated live from real tenant records.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMetrics}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
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
                <span className="font-semibold">AI Tokens Consumed</span>
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{metrics.totalAiCreditsConsumed?.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Across all tenant churches</p>
            </div>
          </div>

          {/* Tenant Lifecycle Breakdown */}
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
