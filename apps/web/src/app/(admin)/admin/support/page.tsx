'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Search, Loader2, CheckCircle2, MessageSquare, ShieldCheck, Send } from 'lucide-react'
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminSupportDeskPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  useEffect(() => {
    loadAllTickets()
  }, [])

  async function loadAllTickets() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'platformSupportTickets')).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setTickets(list)
    } catch {
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'platformSupportTickets', ticketId), {
        status,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Ticket marked as ${status.toUpperCase()}!`)
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)))
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.churchName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Super Admin Support Desk
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide support ticket queue across all onboarded church tenants.
        </p>
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
    </div>
  )
}
