'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Sparkles,
  Zap,
  Settings,
  BarChart3,
  HandHeart,
  DollarSign,
  BookOpen,
  Calendar,
  Radio,
  Heart,
  HandshakeIcon,
  ChevronLeft,
  ChevronRight,
  Bot,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useChurchStore } from '@/store'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Members',
    href: '/members',
    icon: Users,
  },
  {
    label: 'Visitors',
    href: '/visitors',
    icon: UserPlus,
  },
  {
    label: 'Prayer Requests',
    href: '/prayer-requests',
    icon: HandHeart,
  },
  {
    label: 'Testimonies',
    href: '/testimonies',
    icon: Heart,
  },
  {
    label: 'Sermons',
    href: '/sermons',
    icon: BookOpen,
  },
  {
    label: 'Events',
    href: '/events',
    icon: Calendar,
  },
  {
    label: 'Live Service',
    href: '/live-service',
    icon: Radio,
  },
  {
    label: 'Donations',
    href: '/donations',
    icon: DollarSign,
  },
  {
    label: 'Church Store',
    href: '/store',
    icon: ShoppingBag,
  },
  {
    label: 'Partnerships',
    href: '/partnerships',
    icon: HandshakeIcon,
  },
  {
    label: 'Communications',
    href: '/communications',
    icon: MessageSquare,
  },
  {
    label: 'AI Studio',
    href: '/ai-studio',
    icon: Sparkles,
  },
  {
    label: 'Automation',
    href: '/automation',
    icon: Zap,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Support',
    href: '/support',
    icon: HelpCircle,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const { church } = useChurchStore()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar transition-all duration-300 lg:flex',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo / Church Name */}
      <div className="flex h-16 items-center justify-between border-b px-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          {church?.branding?.logoUrl ? (
            <img
              src={church.branding.logoUrl}
              alt={church.name}
              className="h-8 w-8 flex-shrink-0 rounded-lg object-contain border bg-background p-0.5"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 shadow-sm overflow-hidden">
              <img src="/icon.png" alt="Church Growth OS" className="h-6 w-6 object-contain" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-bold text-sidebar-foreground">
                  {church?.name ?? 'Church Growth OS'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">Ministry Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={toggleSidebarCollapsed}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn('nav-item group relative', isActive && 'nav-item-active')}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive && 'text-white'
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 items-center rounded-md border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md group-hover:flex">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* AI Mode indicator (Reads canonical church.preferences.growthMode) */}
      {!sidebarCollapsed && (() => {
        const isManualMode =
          church?.preferences?.growthMode === 'manual' ||
          church?.settings?.aiMode === 'approval'

        return (
          <div className="border-t p-3">
            <Link
              href="/settings?tab=preferences"
              className={`flex items-center gap-2 rounded-xl p-2.5 transition-colors ${
                isManualMode
                  ? 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15'
                  : 'bg-brand-50 border border-brand-500/10 dark:bg-brand-950/30 hover:bg-brand-100/50'
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  isManualMode
                    ? 'bg-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold truncate ${
                    isManualMode
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-brand-700 dark:text-brand-300'
                  }`}
                >
                  {isManualMode ? 'AI Manual Approval Mode' : 'AI Autonomous Mode'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {isManualMode ? 'Human approval required' : 'Working in the background'}
                </p>
              </div>
            </Link>
          </div>
        )
      })()}
    </aside>
  )
}
