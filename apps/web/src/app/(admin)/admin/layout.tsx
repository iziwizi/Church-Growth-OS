'use client'

import { useAuthStore } from '@/store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck,
  Building2,
  Cpu,
  BellRing,
  Activity,
  LogOut,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, role, isInitialized } = useAuthStore()
  const router = useRouter()

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    )
  }

  // Super Admin Security Guard
  const hasAdminAccess = isSuperAdmin || role === 'super_admin' || user?.email?.endsWith('@mujteknify.com')

  if (!user || !hasAdminAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Access Restricted</h1>
        <p className="text-xs text-muted-foreground max-w-sm">
          The Super Admin Portal is restricted to platform administrators of MUJTEKNIFY LIMITED.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/dashboard')}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Church Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Super Admin Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Image src="/logo.png" alt="Logo" width={140} height={36} className="h-8 w-auto object-contain" />
          </div>

          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-brand-500">
              <ShieldCheck className="h-4 w-4" />
              <span>Super Admin Portal</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Platform Operator Mode</p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Activity className="h-4 w-4 text-brand-500" /> Platform Overview
            </Link>
            <Link
              href="/admin/churches"
              className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Building2 className="h-4 w-4 text-brand-500" /> Church Tenants
            </Link>
            <Link
              href="/admin/infrastructure"
              className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Cpu className="h-4 w-4 text-brand-500" /> Infrastructure & APIs
            </Link>
            <Link
              href="/admin/notices"
              className="flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <BellRing className="h-4 w-4 text-brand-500" /> Broadcast Notices
            </Link>
          </nav>
        </div>

        <div className="border-t pt-4 space-y-2 text-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Church App
          </Link>
          <p className="text-[10px] text-muted-foreground">
            MUJTEKNIFY LIMITED &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">{children}</main>
    </div>
  )
}
