'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Plus, Search, Loader2, Paperclip, MessageSquare, CheckCircle2, Clock, X, Upload, Send } from 'lucide-react'
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore } from '@/store'
import { uploadService } from '@/lib/upload'
import { toast } from 'sonner'

export default function SupportDeskPage() {
  const { church } = useChurchStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  // Form State
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Technical')
  const [priority, setPriority] = useState('Medium')
  const [description, setDescription] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  useEffect(() => {
    if (!church?.id) return
    // Real-time listener — a Super Admin reply now appears without a manual
    // refresh, and both consoles read the same `platformSupportTickets`
    // collection (previously two unlinked documents were created per
    // ticket; see docs/PRODUCTION_ENGINEERING_AUDIT.md §3).
    const q = query(
      collection(db, 'platformSupportTickets'),
      where('churchId', '==', church.id),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: any[] = []
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
        setTickets(list)
        setLoading(false)
        setSelectedTicket((prev: any) => (prev ? list.find((t) => t.id === prev.id) ?? prev : prev))
      },
      (err) => {
        console.error('Ticket listener error:', err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [church?.id])

  const handleFileUpload = async (file: File) => {
    if (!church?.id) return
    setUploading(true)
    try {
      const folder = uploadService.getChurchFolder(church.id, 'support')
      const res = await uploadService.upload(file, { folder })
      setAttachmentUrl(res.url)
      toast.success('Attachment uploaded!')
    } catch {
      toast.error('File upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !subject.trim() || !description.trim() || submitting) return
    setSubmitting(true)
    try {
      const idToken = await getIdToken()
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          churchId: church.id,
          churchName: church.name,
          subject: subject.trim(),
          category,
          priority,
          description: description.trim(),
          attachmentUrl: attachmentUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to submit ticket.')
      }

      toast.success('Support ticket submitted successfully!')
      setShowModal(false)
      setSubject('')
      setDescription('')
      setAttachmentUrl('')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || replying) return
    setReplying(true)
    try {
      const idToken = await getIdToken()
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ ticketId: selectedTicket.id, message: replyMessage.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to send reply.')
      }
      toast.success('Reply sent!')
      setReplyMessage('')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reply.')
    } finally {
      setReplying(false)
    }
  }

  const handleCloseTicket = async (ticketId: string) => {
    if (!church?.id) return
    try {
      await updateDoc(doc(db, 'platformSupportTickets', ticketId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      })
      toast.info('Ticket marked as closed.')
    } catch {
      toast.error('Failed to update ticket.')
    }
  }

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-sky-500/10 text-sky-500',
      waiting: 'bg-amber-500/10 text-amber-600',
      in_progress: 'bg-amber-500/10 text-amber-600',
      resolved: 'bg-emerald-500/10 text-emerald-500',
      closed: 'bg-muted text-muted-foreground',
    }
    return styles[status] ?? 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Support & Help Desk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Direct priority support line for {church?.name} to MUJTEKNIFY LIMITED engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets by subject or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-semibold text-foreground">
                      {t.subject}
                      {(t.replies?.length ?? 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-brand-500 font-normal">
                          <MessageSquare className="h-3 w-3" /> {t.replies.length}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">{t.category}</td>
                    <td className="p-3.5">
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(t.status)}`}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="inline-flex h-7 px-3 items-center gap-1 rounded-lg border text-xs font-semibold hover:bg-accent"
                        >
                          View / Reply
                        </button>
                        {t.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => handleCloseTicket(t.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground"
                            title="Close ticket"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Support Tickets</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Create a ticket if you need help from the Church Growth OS team.</p>
        </div>
      )}

      {/* Ticket Detail / Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">{selectedTicket.subject}</h3>
                <p className="text-[11px] text-muted-foreground">{selectedTicket.category} · {selectedTicket.priority}</p>
              </div>
              <button type="button" onClick={() => { setSelectedTicket(null); setReplyMessage('') }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground">You wrote:</p>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                {selectedTicket.attachmentUrl && (
                  <a href={selectedTicket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-500 font-bold hover:underline pt-1">
                    <Paperclip className="h-3 w-3" /> View Attachment
                  </a>
                )}
              </div>

              {(selectedTicket.replies ?? []).map((r: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 space-y-1 ${
                    r.sender === 'Super Admin' ? 'bg-brand-500/5 border-brand-500/20 ml-4' : 'bg-muted/20 mr-4'
                  }`}
                >
                  <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.sender} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'closed' ? (
              <div className="border-t pt-3 space-y-2">
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex w-full rounded-xl border bg-background px-3 py-2 text-xs resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={replying || !replyMessage.trim()}
                    onClick={handleSendReply}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                  >
                    {replying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send Reply
                  </button>
                </div>
              </div>
            ) : (
              <p className="border-t pt-3 text-center text-muted-foreground">This ticket is closed.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Create Support Ticket</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3">
                    <option>Technical</option>
                    <option>Billing</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-medium">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div>
                <label className="font-medium">Attachment (optional)</label>
                <label className="mt-1 flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed bg-background px-3 text-muted-foreground hover:bg-accent">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {attachmentUrl ? 'Attachment uploaded' : 'Upload screenshot or file'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-50">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
