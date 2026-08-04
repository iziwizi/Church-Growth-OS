'use client'

import { useState } from 'react'
import { Server, Activity, DollarSign, Cpu, TrendingUp, Cloud, Database, ShieldCheck } from 'lucide-react'

export default function AdminPlatformHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Cost Monitoring & Margins
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Real-time infrastructure cost tracking, daily/monthly projections, and profit margin estimation.
        </p>
      </div>

      {/* Financial Margin Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <p className="text-muted-foreground font-semibold">Gross Monthly Revenue</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1">₦450,000</p>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1">SaaS Subscriptions</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <p className="text-muted-foreground font-semibold">Total Infrastructure Cost</p>
          <p className="font-display text-2xl font-bold text-rose-500 mt-1">₦62,500</p>
          <p className="text-[10px] text-muted-foreground mt-1">Firebase + AI + Cloudinary</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <p className="text-muted-foreground font-semibold">Estimated Net Profit</p>
          <p className="font-display text-2xl font-bold text-emerald-500 mt-1">₦387,500</p>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1">+86.1% Profit Margin</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <p className="text-muted-foreground font-semibold">Daily Run Rate</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1">₦2,083 / day</p>
          <p className="text-[10px] text-muted-foreground mt-1">Estimated Infrastructure</p>
        </div>
      </div>

      {/* Provider Cost Breakdown */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Cpu className="h-4 w-4 text-brand-500" /> Infrastructure Cost Breakdown
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Anthropic Claude 3.5 Sonnet</span>
              <span className="text-rose-500">₦28,000 / mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">1.2M Tokens consumed</p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Google Firebase Firestore</span>
              <span className="text-rose-500">₦14,500 / mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Read/Write ops & storage</p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>WhatsApp Meta Cloud API</span>
              <span className="text-rose-500">₦12,000 / mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Utility & marketing template messages</p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Cloudinary Media Storage</span>
              <span className="text-rose-500">₦4,000 / mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Image/Logo bandwidth</p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Termii SMS & Resend Email</span>
              <span className="text-rose-500">₦4,000 / mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Transactional dispatches</p>
          </div>
        </div>
      </div>
    </div>
  )
}
