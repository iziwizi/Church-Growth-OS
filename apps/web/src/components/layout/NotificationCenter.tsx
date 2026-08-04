'use client'

import { useState } from 'react'
import { Bell, Check, Sparkles, UserPlus, HandHeart, MessageSquare, AlertCircle } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { motion, AnimatePresence } from 'framer-motion'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'ai' | 'visitor' | 'prayer' | 'comm' | 'alert'
  read: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'AI Morning Declaration Sent',
    description: 'Autonomous engine sent declaration to 318 active members.',
    time: '6:00 AM',
    type: 'ai',
    read: false,
  },
  {
    id: '2',
    title: 'New Visitor Follow-up Scheduled',
    description: 'AI assigned Pastor John for 48h check-in with Brother David.',
    time: '8:30 AM',
    type: 'visitor',
    read: false,
  },
  {
    id: '3',
    title: 'New Prayer Request Received',
    description: 'Sister Sarah submitted a prayer request for family healing.',
    time: '9:15 AM',
    type: 'prayer',
    read: false,
  },
  {
    id: '4',
    title: 'Daily AI Executive Report Ready',
    description: 'Morning executive summary generated and delivered to email.',
    time: '6:05 AM',
    type: 'ai',
    read: true,
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="h-4 w-4 text-purple-400" />
      case 'visitor':
        return <UserPlus className="h-4 w-4 text-emerald-400" />
      case 'prayer':
        return <HandHeart className="h-4 w-4 text-rose-400" />
      case 'comm':
        return <MessageSquare className="h-4 w-4 text-blue-400" />
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-400" />
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card p-0 shadow-xl backdrop-blur-md outline-none animate-in fade-in-50 zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 dark:bg-brand-950/60 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => markAsRead(item.id)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                      !item.read ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg border bg-background p-2 shadow-xs shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
