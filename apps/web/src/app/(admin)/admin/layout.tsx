'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, useChurchStore } from '@/store'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Tag,
  Receipt,
  Gift,
  Cpu,
  Cloud,
  Flame,
  MessageSquare,
  Mail,
  Server,
  BarChart3,
  HelpCircle,
  Megaphone,
  FileText,
  Flag,
  Sliders,
  User,
  LogOut,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { logOut } from '@/lib/firebase/auth'

const ADMIN_NAV_ITEMS = [
  { group: 'Core Management', items: [
    { label: 'Dashboard', href: '/admin', icon: BarChart3 },
    { label: 'Church Tenants', href: '/admin/churches', icon: Building2 },
    { label: 'Platform Users', href: '/admin/users', icon: Users },
  ]},
  { group: 'Financial & Billing', items: [
    { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { label: 'Pricing Plans', href: '/admin/pricing-plans', icon: Tag },
    { label: 'Payments', href: '/admin/payments', icon: Receipt },
    { label: 'Invoices', href: '/admin/invoices', icon: FileText },
    { label: 'Coupons & Promos', href: '/admin/coupons', icon: Gift },
  ]},
  { group: 'Integrations & Providers', items: [
    { label: 'AI Providers', href: '/admin/ai-providers', icon: Cpu },
    { label: 'Cloudinary Storage', href: '/admin/cloudinary', icon: Cloud },
    { label: 'Firebase Engine', href: '/admin/firebase', icon: Flame },
    { label: 'WhatsApp Gateway', href: '/admin/whatsapp', icon: MessageSquare },
    { label: 'Email Gateway (Resend)', href: '/admin/email-providers', icon: Mail },
  ]},
  { group: 'Operations & Platform', items: [
    { label: 'Infrastructure', href: '/admin/infrastructure', icon: Server },
    { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Support Desk', href: '/admin/support', icon: HelpCircle },
    { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
    { label: 'System Settings', href: '/admin/system-settings', icon: Sliders },
  ]},
  { group: 'Account', items: [
    { label: 'Admin Profile', href: '/admin/profile', icon: User },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, role, isInitialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [timedOut, setTimedOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Safety: never spin forever if auth init is slow
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  console.log('[ADMIN_LAYOUT_DEBUG] (apps/web/src/app/(admin)/admin/layout.tsx:105) AdminLayout rendered. Pathname:', pathname)
  console.log('  isInitialized :', isInitialized)
  console.log('  timedOut      :', timedOut)
  console.log('  user          :', user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : null)
  console.log('  isSuperAdmin  :', isSuperAdmin)
  console.log('  role          :', role)

  // Public admin login page — skip layout guard
  if (pathname === '/admin/login') {
    console.log('[ADMIN_LAYOUT_DEBUG] (AdminLayout.tsx:112) Public route /admin/login — skipping layout access guard.')
    return <>{children}</>
  }

  // Show spinner during auth initialization
  if (!isInitialized && !timedOut) {
    console.log('[ADMIN_LAYOUT_DEBUG] (AdminLayout.tsx:118) Waiting for auth initialization...')
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-semibold text-muted-foreground">
          Authenticating Super Admin session...
        </p>
      </div>
    )
  }

  const hasAdminAccess =
    isSuperAdmin ||
    role === 'super_admin' ||
    user?.email?.endsWith('@mujteknify.com')

  console.log('[ADMIN_LAYOUT_DEBUG] (AdminLayout.tsx:132) Computed hasAdminAccess:', hasAdminAccess)

  // Unauthenticated → redirect to admin login
  if (!user) {
    console.error('====================================================')
    console.error('[ADMIN_LAYOUT_REDIRECT] REDIRECTED BY: AdminLayout.tsx line 137')
    console.error('  Reason: user is null (unauthenticated)')
    console.error('  Target: /admin/login')
    console.error('====================================================')
    if (typeof window !== 'undefined') {
      router.replace('/admin/login')
    }
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  // Restricted Access screen for regular users
  if (!hasAdminAccess) {
    console.error('====================================================')
    console.error('[ADMIN_LAYOUT_RESTRICTED] ACCESS DENIED BY: AdminLayout.tsx line 152')
    console.error('  User         :', user.email, 'UID:', user.uid)
    console.error('  isSuperAdmin :', isSuperAdmin)
    console.error('  role         :', role)
    console.error('====================================================')
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Access Restricted</h1>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          This portal is restricted to MUJTEKNIFY LIMITED platform administrators.
        </p>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              console.log('[ADMIN_LAYOUT_DEBUG] User clicked Return to Church Dashboard → router.replace(\'/dashboard\')')
              router.replace('/dashboard')
            }}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Church Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('[ADMIN_LAYOUT_DEBUG] User clicked Sign in with admin credentials → router.replace(\'/admin/login\')')
              router.replace('/admin/login')
            }}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline pt-2"
          >
            Sign in with administrator credentials
          </button>
        </div>
      </div>
    )
  }

  const handleAdminLogout = async () => {
    try {
      await logOut()
      useAuthStore.getState().reset()
      useChurchStore.getState().setChurch(null)
      toast.success('Signed out of Super Admin Console.')
      router.replace('/admin/login')
    } catch {
      toast.error('Logout failed.')
    }
  }

  // Generate current breadcrumb title
  const currentPathSegment = pathname.split('/').pop() || 'Dashboard'
  const formattedBreadcrumb = currentPathSegment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ── 1. PERSISTENT SIDEBAR (Desktop) ───────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={140}
              height={36}
              className="h-8 w-auto object-contain rounded-lg shrink-0"
            />
            {!sidebarCollapsed && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-500 border border-brand-500/20">
                Super Admin
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground hidden lg:block"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Admin Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {ADMIN_NAV_ITEMS.map((group) => (
            <div key={group.group} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xs font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer Session Card */}
        <div className="border-t border-border p-3 space-y-2 text-xs">
          {!sidebarCollapsed && (
            <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Session Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdminLogout}
            className={`flex h-9 w-full items-center gap-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 px-3 text-xs font-semibold transition-colors ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── 2. MOBILE DRAWER ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs">
          <div className="w-72 bg-card border-r border-border p-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <Image
                  src="/logo.png"
                  alt="Church Growth OS"
                  width={140}
                  height={36}
                  className="h-8 w-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-160px)] space-y-4 pr-1">
                {ADMIN_NAV_ITEMS.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium ${
                            isActive
                              ? 'bg-brand-600 text-white font-semibold'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── 3. MAIN CONTENT AREA + TOP NAV BAR ───────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-accent md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground font-medium">
                Admin
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-bold text-foreground">{formattedBreadcrumb}</span>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3 text-xs">
            {/* Quick Search */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search admin console..."
                className="h-8 w-48 rounded-xl border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Toggle theme mode"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-accent transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border bg-card p-4 shadow-lg text-xs space-y-3 z-50">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-foreground">Admin Notices</span>
                    <span className="text-[10px] text-brand-500 font-semibold">2 New</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl border bg-muted/20 p-2.5">
                      <p className="font-bold text-foreground text-[11px]">System Status</p>
                      <p className="text-[10px] text-muted-foreground">All 25 Firestore security rules deployed and active.</p>
                    </div>
                    <div className="rounded-xl border bg-muted/20 p-2.5">
                      <p className="font-bold text-foreground text-[11px]">New Church Tenant</p>
                      <p className="text-[10px] text-muted-foreground">Tenant registered on 14-day Free Trial.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-xl border bg-background p-1 pr-3 hover:bg-accent transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 font-bold text-white text-xs">
                  {user.email?.charAt(0).toUpperCase() ?? 'A'}
                </div>
                <span className="font-semibold text-foreground hidden sm:inline">
                  {user.email?.split('@')[0] ?? 'Admin'}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border bg-card p-2 shadow-lg text-xs space-y-1 z-50">
                  <div className="px-3 py-2 border-b">
                    <p className="font-bold text-foreground truncate">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground">Super Administrator</p>
                  </div>
                  <Link
                    href="/admin/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex h-8 items-center gap-2 rounded-xl px-3 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <User className="h-3.5 w-3.5" /> Admin Profile
                  </Link>
                  <Link
                    href="/admin/system-settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex h-8 items-center gap-2 rounded-xl px-3 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Sliders className="h-3.5 w-3.5" /> System Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="flex h-8 w-full items-center gap-2 rounded-xl px-3 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background/50">{children}</main>
      </div>
    </div>
  )
}
