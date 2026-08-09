'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  DollarSign,
  Cpu,
  Server,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

interface PlatformStats {
  churchesCount: number
  usersCount: number
  trialChurches: number
  paidChurches: number
  totalAiCreditsConsumed: number
  providerConfig: Record<string, string>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    churchesCount: 0,
    usersCount: 0,
    trialChurches: 0,
    paidChurches: 0,
    totalAiCreditsConsumed: 0,
    providerConfig: {},
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        // 1. Church tenants
        const cSnap = await getDocs(collection(db, 'churches')).catch(() => null)
        const churches = cSnap?.docs.map((d) => ({ id: d.id, ...d.data() as any })) ?? []

        const trialChurches = churches.filter(
          (c: any) => c.subscription?.status === 'trialing' || c.subscription?.planId === 'free_trial'
        ).length
        const paidChurches = churches.filter(
          (c: any) => c.subscription?.status === 'active' && c.subscription?.planId !== 'free_trial'
        ).length

        // AI tokens consumed across all churches
        const totalAiCreditsConsumed = churches.reduce((sum: number, c: any) => {
          const total = c.subscription?.aiCreditsTotal ?? 0
          const remaining = c.subscription?.aiCreditsRemaining ?? total
          return sum + Math.max(0, total - remaining)
        }, 0)

        // 2. Users count
        const uSnap = await getDocs(collection(db, 'users')).catch(() => null)

        // 3. Infrastructure config (provider status)
        const infraSnap = await getDoc(doc(db, 'system', 'infrastructure')).catch(() => null)
        const infraData = infraSnap?.exists() ? infraSnap.data() : {}

        setStats({
          churchesCount: churches.length,
          usersCount: uSnap?.size ?? 0,
          trialChurches,
          paidChurches,
          totalAiCreditsConsumed,
          providerConfig: {
            agentrouter: (infraData?.agentrouterKey || infraData?.agentRouterKey || infraData?.agentrouterApiKey) ? 'Configured' : 'Not Configured',
            whatsapp: (infraData?.metaWhatsappToken || infraData?.metaWhatsappPhoneId) ? 'Configured' : 'Not Configured',
            resend: (infraData?.resendKey || process.env.RESEND_API_KEY) ? 'Configured' : 'Not Configured',
            cloudinary: (infraData?.cloudinaryApiKey || process.env.CLOUDINARY_API_KEY) ? 'Configured' : 'Not Configured',
            sms: (infraData?.termiiKey || process.env.TERMII_API_KEY) ? 'Configured' : 'Not Configured',
            payments: (infraData?.paystackSecret || infraData?.flutterwaveSecret) ? 'Configured' : 'Not Configured',
          },
        })
      } catch (err) {
        console.error('Admin dashboard load error:', err)
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

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards — all from real Firestore */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Active Church Tenants</span>
                <Building2 className="h-4 w-4 text-brand-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stats.churchesCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {stats.paidChurches} paid · {stats.trialChurches} trialing
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Platform Users</span>
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stats.usersCount}</p>
              <p className="text-[11px] text-muted-foreground">Across all church tenants</p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Paid Subscriptions</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stats.paidChurches}</p>
              <p className="text-[11px] text-emerald-500 font-semibold">Growth &amp; Enterprise tiers</p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">AI Tokens Consumed</span>
                <Cpu className="h-4 w-4 text-sky-500" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {stats.totalAiCreditsConsumed.toLocaleString()}
              </p>
              <p className="text-[11px] text-sky-500 font-semibold">Across all tenants</p>
            </div>
          </div>

          {/* Subscription Breakdown */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              Subscription Tier Breakdown
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <p className="font-bold text-foreground">Free Trial</p>
                <p className="font-display text-xl font-bold text-amber-500">{stats.trialChurches}</p>
                <p className="text-[11px] text-muted-foreground">14-day trial churches</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <p className="font-bold text-foreground">Paid Plans</p>
                <p className="font-display text-xl font-bold text-emerald-500">{stats.paidChurches}</p>
                <p className="text-[11px] text-muted-foreground">Growth &amp; Enterprise</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <p className="font-bold text-foreground">Total Tenants</p>
                <p className="font-display text-xl font-bold text-brand-500">{stats.churchesCount}</p>
                <p className="text-[11px] text-muted-foreground">All onboarded churches</p>
              </div>
            </div>
          </div>

          {/* Infrastructure Status */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500" />
              Platform Infrastructure Status
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">AgentRouter AI Gateway</p>
                  <p className="text-[10px] text-muted-foreground">Multi-Model AI Engine</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  stats.providerConfig.agentrouter === 'Configured'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {stats.providerConfig.agentrouter ?? 'Unknown'}
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Firebase Firestore</p>
                  <p className="text-[10px] text-muted-foreground">Google Cloud Multi-Region</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  Operational
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Resend Email Gateway</p>
                  <p className="text-[10px] text-muted-foreground">Transactional Delivery</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  stats.providerConfig.resend === 'Configured'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {stats.providerConfig.resend ?? 'Unknown'}
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">WhatsApp Meta Cloud</p>
                  <p className="text-[10px] text-muted-foreground">WABA + Shared Engine</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  stats.providerConfig.whatsapp === 'Configured'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {stats.providerConfig.whatsapp ?? 'Unknown'}
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Cloudinary Storage</p>
                  <p className="text-[10px] text-muted-foreground">Media &amp; CDN Storage</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  stats.providerConfig.cloudinary === 'Configured'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {stats.providerConfig.cloudinary ?? 'Unknown'}
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Termii SMS Gateway</p>
                  <p className="text-[10px] text-muted-foreground">SMS Sender ID Delivery</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  stats.providerConfig.sms === 'Configured'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {stats.providerConfig.sms ?? 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs">
            <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Platform Management
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              {[
                { label: 'Church Tenants', href: '/admin/churches' },
                { label: 'AI Providers', href: '/admin/ai-providers' },
                { label: 'Billing & Plans', href: '/admin/billing' },
                { label: 'Support Tickets', href: '/admin/support' },
                { label: 'Platform Health', href: '/admin/platform-health' },
                { label: 'System Settings', href: '/admin/system-settings' },
                { label: 'Analytics', href: '/admin/analytics' },
                { label: 'Notices', href: '/admin/notices' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border bg-muted/20 p-3 font-semibold text-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
