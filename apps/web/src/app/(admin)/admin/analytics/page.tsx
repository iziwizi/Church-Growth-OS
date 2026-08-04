'use client'

import { Activity, TrendingUp, Building2, Users, DollarSign } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Growth Analytics
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          SaaS subscription growth, MRR, ARR, and active church retention metrics for MUJTEKNIFY LIMITED.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <p className="text-muted-foreground font-semibold">Monthly Recurring Revenue (MRR)</p>
          <p className="font-display text-2xl font-bold text-foreground">₦450,000</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <p className="text-muted-foreground font-semibold">Annual Run Rate (ARR)</p>
          <p className="font-display text-2xl font-bold text-foreground">₦5,400,000</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <p className="text-muted-foreground font-semibold">Net Customer Churn</p>
          <p className="font-display text-2xl font-bold text-emerald-500">0.0%</p>
        </div>
      </div>
    </div>
  )
}
