'use client'

import { useState, useEffect, useMemo } from 'react'
import { Megaphone, Plus, Loader2, Trash2, Users, Building2, Globe } from 'lucide-react'
import { collection, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { adminFetch } from '@/lib/adminFetch'
import { toast } from 'sonner'

type Scope = 'all' | 'selected_churches' | 'selected_users'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [selectedChurchIds, setSelectedChurchIds] = useState<string[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadAnnouncements()
    loadRecipientSources()
  }, [])

  async function loadAnnouncements() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/announcements')
      const data = await res.json()
      if (res.ok && data.success) {
        setAnnouncements(data.announcements ?? [])
      }
    } catch {
      toast.error('Could not load announcements.')
    } finally {
      setLoading(false)
    }
  }

  async function loadRecipientSources() {
    try {
      const [churchesRes, usersRes] = await Promise.all([
        adminFetch('/api/admin/churches'),
        adminFetch('/api/admin/users'),
      ])
      const churchesData = await churchesRes.json()
      const usersData = await usersRes.json()
      if (churchesRes.ok && churchesData.success) setChurches(churchesData.churches ?? [])
      if (usersRes.ok && usersData.success) setUsers(usersData.users ?? [])
    } catch {
      // Non-fatal — "All Churches" scope still works without these lists.
    }
  }

  const recipientCount = useMemo(() => {
    if (scope === 'all') return churches.length
    if (scope === 'selected_churches') return selectedChurchIds.length
    if (scope === 'selected_users') {
      const churchIds = new Set(users.filter((u) => selectedUserIds.includes(u.id)).map((u) => u.churchId).filter(Boolean))
      return churchIds.size
    }
    return 0
  }, [scope, churches, selectedChurchIds, selectedUserIds, users])

  const toggleChurch = (id: string) => {
    setSelectedChurchIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }
  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]))
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim() || sending) return
    if (scope === 'selected_churches' && selectedChurchIds.length === 0) {
      toast.error('Select at least one church.')
      return
    }
    if (scope === 'selected_users' && selectedUserIds.length === 0) {
      toast.error('Select at least one user.')
      return
    }
    setSending(true)
    try {
      const res = await adminFetch('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          scope,
          churchIds: scope === 'selected_churches' ? selectedChurchIds : undefined,
          userIds: scope === 'selected_users' ? selectedUserIds : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to send announcement.')
      }
      toast.success(`📢 Announcement sent to ${data.recipientCount} church(es)!`)
      setTitle('')
      setMessage('')
      setSelectedChurchIds([])
      setSelectedUserIds([])
      loadAnnouncements()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send announcement.')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteAnnouncement = async (annId: string) => {
    try {
      await deleteDoc(doc(collection(db, 'announcements'), annId))
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
          Broadcast system announcements, feature updates, and maintenance notices to church dashboards — to everyone, selected churches, or selected users.
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

          <div className="space-y-2">
            <label className="font-semibold">Recipients</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition-all ${
                  scope === 'all' ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-muted-foreground'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> All Churches
              </button>
              <button
                type="button"
                onClick={() => setScope('selected_churches')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition-all ${
                  scope === 'selected_churches' ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-muted-foreground'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" /> Selected Churches
              </button>
              <button
                type="button"
                onClick={() => setScope('selected_users')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition-all ${
                  scope === 'selected_users' ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-muted-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Selected Users
              </button>
            </div>

            {scope === 'selected_churches' && (
              <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1">
                {churches.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent cursor-pointer">
                    <input type="checkbox" checked={selectedChurchIds.includes(c.id)} onChange={() => toggleChurch(c.id)} />
                    <span>{c.name}</span>
                  </label>
                ))}
                {churches.length === 0 && <p className="text-muted-foreground p-2">No churches found.</p>}
              </div>
            )}

            {scope === 'selected_users' && (
              <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent cursor-pointer">
                    <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
                    <span>{u.fullName} ({u.email})</span>
                  </label>
                ))}
                {users.length === 0 && <p className="text-muted-foreground p-2">No users found.</p>}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              This will reach <span className="font-bold text-foreground">{recipientCount}</span> church{recipientCount === 1 ? '' : 'es'}.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Publish &amp; Send Notice
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
          <h2 className="font-display text-base font-bold text-foreground">Published Notices</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border p-4 bg-muted/10">
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">{a.title}</p>
                  <p className="text-muted-foreground">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Sent to {a.recipientCount ?? 0} church(es) · {a.scope?.replace('_', ' ')} · {a.deliveryStatus}
                    {a.senderEmail ? ` · by ${a.senderEmail}` : ''}
                  </p>
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
            {announcements.length === 0 && <p className="text-muted-foreground">No announcements published yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
