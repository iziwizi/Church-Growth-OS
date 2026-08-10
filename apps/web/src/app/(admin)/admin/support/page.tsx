'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

export default function AdminSupportDeskPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadAllTickets()
  }, [])

  async function loadAllTickets() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/support')
      const data = await res.json()
      if (res.ok && data.success) {
        setTickets(data.tickets ?? [])
      } else {
        toast.error(data.error ?? 'Failed to load tickets.')
      }
    } catch (err: any) {
      toast.error(`Failed to load tickets: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string, reply?: string) => {
    if (updating) return
    setUpdating(true)
    try {
      const res = await adminFetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status, replyMessage: reply }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Ticket marked as ${status.toUpperCase()}!`)
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)))
      } else {
        toast.error(data.error ?? 'Failed to update status.')
      }
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.churchName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Super Admin Support Desk
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Platform-wide support ticket queue across all onboarded church tenants.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAllTickets}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Search tickets by church or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-xl border-none bg-transparent text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Church Tenant</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{t.churchName ?? 'Church'}</td>
                  <td className="p-3.5">
                    <p className="font-semibold text-foreground">{t.subject}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{t.userEmail}</p>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      className="rounded-xl border bg-background px-2 py-1 text-xs font-semibold capitalize"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      className="inline-flex h-7 px-3 items-center gap-1 rounded-lg border text-xs font-semibold hover:bg-accent"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">{selectedTicket.subject}</h3>
                <p className="text-[11px] text-muted-foreground">{selectedTicket.churchName} ({selectedTicket.userEmail})</p>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-foreground">Category: {selectedTicket.category}</span>
                  <span className="font-bold text-amber-500">Priority: {selectedTicket.priority}</span>
                </div>
                <p className="text-foreground leading-relaxed pt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
                {selectedTicket.attachmentUrl && (
                  <div className="pt-2">
                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 font-bold hover:underline">
                      📎 View Uploaded Attachment
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold">Super Admin Reply</label>
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type reply to notify church pastor..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setSelectedTicket(null)} className="h-8 rounded-xl border px-3">Close</button>
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  handleUpdateStatus(selectedTicket.id, 'resolved', replyMessage)
                  setSelectedTicket(null)
                  setReplyMessage('')
                }}
                className="h-8 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
              >
                Send Reply &amp; Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
