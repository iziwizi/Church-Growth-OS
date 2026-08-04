'use client'

import { Calendar, Users, MapPin, Video, ArrowRight } from 'lucide-react'

export interface EventItem {
  id: string
  title: string
  date: string
  time: string
  isOnline: boolean
  registrations: number
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Sunday Breakthrough Service',
    date: 'This Sunday',
    time: '8:00 AM & 10:30 AM',
    isOnline: true,
    registrations: 340,
  },
  {
    id: '2',
    title: 'Leadership & Worker Training',
    date: 'Wednesday',
    time: '6:00 PM',
    isOnline: false,
    registrations: 65,
  },
  {
    id: '3',
    title: 'Night of Glory Prayer Vigil',
    date: 'Friday, Aug 8',
    time: '10:00 PM',
    isOnline: true,
    registrations: 210,
  },
]

export function UpcomingEventsCard({ events = DEFAULT_EVENTS }: { events?: EventItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Upcoming Events</h2>
            <p className="text-xs text-muted-foreground">Automated promotion & reminders active</p>
          </div>
        </div>
        <a href="/events" className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
          All Events <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex items-start justify-between rounded-xl border border-border bg-muted/20 p-3.5 transition-all hover:bg-muted/50"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">{evt.title}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-brand-500" />
                  {evt.date} • {evt.time}
                </span>
                <span className="flex items-center gap-1">
                  {evt.isOnline ? (
                    <Video className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <MapPin className="h-3 w-3 text-amber-500" />
                  )}
                  {evt.isOnline ? 'Online' : 'In-Person'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-500 shrink-0">
              <Users className="h-3 w-3" />
              {evt.registrations}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
