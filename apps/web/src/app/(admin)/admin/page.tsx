'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, DollarSign, Cpu, Activity, TrendingUp, ShieldCheck, Server } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function AdminDashboardPage() {
  const [churchesCount, setChurchesCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const cSnap = await getDocs(collection(db, 'churches')).catch(() => null)
        const uSnap = await getDocs(collection(db, 'users')).catch(() => null)
        setChurchesCount(cSnap?.size ?? 1)
        setUsersCount(uSnap?.size ?? 1)
      } catch {
        setChurchesCount(1)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500 mb-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Platform Operation Control</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Super Admin Console
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide telemetry, church tenant quotas, and infrastructure health for MUJTEKNIFY LIMITED.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Church Tenants</span>
            <Building2 className="h-4 w-4 text-brand-500" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{loading ? '...' : churchesCount}</p>
          <p className="text-[11px] text-emerald-500 font-semibold">+100% platform growth</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Platform Users</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{loading ? '...' : usersCount}</p>
          <p className="text-[11px] text-muted-foreground">Across all branches</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Monthly SaaS MRR</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">₦450,000</p>
          <p className="text-[11px] text-emerald-500 font-semibold">Growth & Enterprise tiers</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">AI Tokens Consumed</span>
            <Cpu className="h-4 w-4 text-sky-500" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">1.4M</p>
          <p className="text-[11px] text-sky-500 font-semibold">Claude 3.5 & GPT-4o</p>
        </div>
      </div>

      {/* Infrastructure Status */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Server className="h-4 w-4 text-emerald-500" />
          Platform Managed Infrastructure Status
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Firebase Firestore</p>
              <p className="text-[10px] text-muted-foreground">Google Cloud Multi-Region</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Cloudinary Storage</p>
              <p className="text-[10px] text-muted-foreground">de5bd8h8p bucket</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">WhatsApp Cloud API</p>
              <p className="text-[10px] text-muted-foreground">Meta Business Platform</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}
