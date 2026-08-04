'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Sparkles, UserPlus, HandHeart, MessageSquare, AlertCircle } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'ai' | 'visitor' | 'prayer' | 'comm' | 'alert'
  read: boolean
}

export function NotificationCenter() {
  const router = useRouter()
  const { church } = useChurchStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Autonomous AI Engine Active',
      description: 'Morning executive summary generated and delivered.',
      time: '6:00 AM',
      type: 'ai',
      read: false,
    },
    {
      id: '2',
      title: '7-Step Visitor Sequence Online',
      description: 'Guest retention automation monitoring new intake.',
      time: '8:30 AM',
      type: 'visitor',
      read: false,
    },
  ])

  useEffect(() => {
    if (!church?.id) return
    const q = query(
      collection(db, 'churches', church.id, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap && !snap.empty) {
          const list: NotificationItem[] = []
          snap.docs.forEach((d) => {
            const data = d.data()
            list.push({
              id: d.id,
              title: data.title ?? 'Notification',
              description: data.description ?? '',
              time: data.time ?? 'Just now',
              type: data.type ?? 'ai',
              read: data.read ?? false,
            })
          })
          setNotifications(list)
        }
      },
      (err) => {
        console.warn('Notification listener notice:', err)
      }
    )

    return () => unsubscribe()
  }, [church?.id])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id)
    switch (item.type) {
      case 'visitor':
        router.push('/visitors')
        break
      case 'prayer':
        router.push('/prayer-requests')
        break
      case 'comm':
        router.push('/communications')
        break
      case 'ai':
        router.push('/reports')
        break
      case 'alert':
        router.push('/support')
        break
      default:
        router.push('/dashboard')
    }
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
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-500">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

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
                    onClick={() => handleNotificationClick(item)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                      !item.read ? 'bg-brand-500/5' : ''
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
