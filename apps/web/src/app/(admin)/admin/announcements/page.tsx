'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Loader2, Trash2 } from 'lucide-react'
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function loadAnnouncements() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'announcements')).catch(() => null)
      const list: any[] = []
      snap?.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setAnnouncements(list)
    } catch {
      toast.error('Could not load announcements.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setAdding(true)
    try {
      const annId = `ann-${Date.now()}`
      await setDoc(doc(db, 'announcements', annId), {
        title: title.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
      })
      toast.success('📢 Platform announcement broadcasted to all church dashboards!')
      setTitle('')
      setMessage('')
      loadAnnouncements()
    } catch {
      toast.error('Failed to broadcast announcement.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteAnnouncement = async (annId: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', annId))
      toast.success('Announcement removed.')
      setAnnouncements((prev) => prev.filter((a) => a.id !== annId))
    } catch {
      toast.error('Failed to delete announcement.')
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Broadcast Notices &amp; Announcements
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Broadcast system announcements, feature updates, and maintenance notices directly to all tenant church dashboards.
        </p>
      </div>

      <form onSubmit={handleCreateAnnouncement} className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-brand-500" />
          Broadcast New Announcement
        </h2>
        <div className="space-y-3">
          <div>
            <label className="font-semibold">Notice Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance — Sunday 2:00 AM WAT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Message Body</label>
            <textarea
              rows={3}
              required
              placeholder="Detailed announcement description..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Publish Notice
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">Active Published Notices</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border p-4 bg-muted/10">
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">{a.title}</p>
                  <p className="text-muted-foreground">{a.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
