'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, Search, Loader2, Trash2, CheckCircle2, X, MapPin, Clock } from 'lucide-react'
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function EventsPage() {
  const { church } = useChurchStore()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!church?.id) return
    loadEvents()
  }, [church?.id])

  async function loadEvents() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'events'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setEvents(list)
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !title.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'events'), {
        title: title.trim(),
        startDate,
        startTime,
        location: location.trim(),
        isOnline,
        registrationsCount: 0,
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Event scheduled successfully!')
      setShowModal(false)
      setTitle('')
      setStartDate('')
      setStartTime('')
      setLocation('')
      loadEvents()
    } catch {
      toast.error('Failed to schedule event.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete event?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'events', id))
      toast.success('Event deleted.')
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error('Failed to delete event.')
    }
  }

  const filteredEvents = events.filter((e) => e.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Events Planner & Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule services, conferences, and automated reminders for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-600 px-4 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Schedule Event
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-500">
                    {ev.isOnline ? 'Online Broadcast' : 'On-Site Event'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">{ev.startDate}</span>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground mt-2">{ev.title}</h3>
                <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-sky-500" />{ev.startTime || 'Time TBD'}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-sky-500" />{ev.location || 'Main Auditorium'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-[11px] font-medium text-muted-foreground">{ev.registrationsCount ?? 0} Registered</span>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Upcoming Events</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Schedule Sunday service, youth rally, or mid-week prayer meeting.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Schedule Ministry Event</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Celebration Service"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium">Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-medium">Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>
              <div>
                <label className="font-medium">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Main Auditorium or Online Link"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isOnline" className="font-medium">This is an online / live streamed event</label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
