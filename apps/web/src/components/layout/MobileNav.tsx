'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Sparkles,
  Zap,
  Settings,
  BarChart3,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChurchStore } from '@/store'

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Visitors', href: '/visitors', icon: UserPlus },
  { label: 'Communications', href: '/communications', icon: MessageSquare },
  { label: 'AI Studio', href: '/ai-studio', icon: Sparkles },
  { label: 'Automation', href: '/automation', icon: Zap },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { church } = useChurchStore()

  return (
    <>
      {/* Mobile hamburger — shown only on mobile */}
      <div className="fixed left-0 top-0 z-40 flex h-16 w-full items-center border-b bg-background/90 px-4 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border text-foreground"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-bold">{church?.name ?? 'Church Growth OS'}</span>
        </div>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar lg:hidden"
            >
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-display text-sm font-bold text-sidebar-foreground">
                    {church?.name ?? 'Church Growth OS'}
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="p-3">
                <ul className="space-y-0.5">
                  {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn('nav-item', isActive && 'nav-item-active')}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
