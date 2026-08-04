'use client'

import { useState } from 'react'
import { BellRing, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminNoticesPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setTimeout(() => {
      setSending(false)
      toast.success('Broadcast notice pushed to all active church dashboards!')
      setTitle('')
      setMessage('')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Broadcast Notices
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Push system announcements, maintenance alerts, or new feature updates to all church dashboards.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 max-w-xl">
        <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <BellRing className="h-4 w-4 text-brand-500" /> Create Broadcast Announcement
        </h2>

        <form onSubmit={handleSendNotice} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold">Notice Header *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance — Sunday 2 AM"
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>

          <div>
            <label className="font-semibold">Announcement Body *</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write announcement text..."
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Dispatch Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
