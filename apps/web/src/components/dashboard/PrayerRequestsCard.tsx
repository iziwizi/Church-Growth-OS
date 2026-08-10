'use client'

import Link from 'next/link'
import { HandHeart, ArrowRight, Clock, MessageCircle } from 'lucide-react'

export interface PrayerItem {
  id: string
  memberName: string
  request: string
  category: string
  status: 'open' | 'praying' | 'answered'
  timeAgo: string
}

const DEFAULT_PRAYERS: PrayerItem[] = [
  {
    id: '1',
    memberName: 'Brother Michael',
    request: 'Praying for open door and divine breakthrough in new business venture.',
    category: 'Finances',
    status: 'praying',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    memberName: 'Sister Mercy',
    request: 'Safe delivery and divine health for newborn baby.',
    category: 'Family',
    status: 'answered',
    timeAgo: '5h ago',
  },
  {
    id: '3',
    memberName: 'Anonymous',
    request: 'Healing and full recovery for father in hospital.',
    category: 'Healing',
    status: 'open',
    timeAgo: '1d ago',
  },
]

export function PrayerRequestsCard({ prayers = DEFAULT_PRAYERS }: { prayers?: PrayerItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <HandHeart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Prayer Requests</h2>
            <p className="text-xs text-muted-foreground">Recent congregation prayer needs</p>
          </div>
        </div>
        <Link href="/prayer-requests" className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {prayers.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1.5 transition-all hover:bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{item.memberName}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {item.category}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.status === 'answered'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : item.status === 'praying'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.request}
            </p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.timeAgo}
              </span>
              <span className="flex items-center gap-1 text-brand-500">
                <MessageCircle className="h-3 w-3" />
                Encourage
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
