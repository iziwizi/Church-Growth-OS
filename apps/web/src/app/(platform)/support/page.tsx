'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Plus, Search, Loader2, Paperclip, MessageSquare, CheckCircle2, Clock, X, Upload } from 'lucide-react'
import { collection, query, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { uploadService } from '@/lib/upload'
import { toast } from 'sonner'

export default function SupportDeskPage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form State
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Technical')
  const [priority, setPriority] = useState('Medium')
  const [description, setDescription] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadTickets()
  }, [church?.id])

  async function loadTickets() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'supportTickets'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setTickets(list)
    } catch (err) {
      console.error('Error loading tickets:', err)
    } finally {
      setLoading(false)
    }
  }

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
    if (!church?.id || !subject.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'supportTickets'), {
        churchId: church.id,
        churchName: church.name,
        userEmail: user?.email ?? 'admin@church.org',
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        attachmentUrl,
        status: 'open',
        replies: [],
        createdAt: serverTimestamp(),
      })

      // Also copy to central platform support collection for Super Admin
      await addDoc(collection(db, 'platformSupportTickets'), {
        churchId: church.id,
        churchName: church.name,
        userEmail: user?.email ?? 'admin@church.org',
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        attachmentUrl,
        status: 'open',
        replies: [],
        createdAt: serverTimestamp(),
      })

      // Trigger Email Notification to Super Admin
      fetch('/api/support/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@mujteknify.com',
          subject: `[New Ticket] ${subject.trim()}`,
          ticketId: church.id,
          churchName: church.name,
          message: `Category: ${category}\nPriority: ${priority}\nFrom: ${user?.email}\n\n${description.trim()}`,
        }),
      }).catch(() => null)

      toast.success('Support ticket submitted successfully!')
      setShowModal(false)
      setSubject('')
      setDescription('')
      setAttachmentUrl('')
      loadTickets()
    } catch {
      toast.error('Failed to submit support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseTicket = async (ticketId: string) => {
    if (!church?.id) return
    try {
      await updateDoc(doc(db, 'churches', church.id, 'supportTickets', ticketId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      })
      toast.info('Ticket marked as closed.')
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: 'closed' } : t)))
    } catch {
      toast.error('Failed to update ticket.')
    }
  }

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  )

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
                  <td className="p-3.5 font-bold text-foreground">
                    <div>
                      <p>{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground font-normal line-clamp-1">{t.description}</p>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-muted-foreground">{t.category}</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                        t.status === 'closed'
                          ? 'bg-muted text-muted-foreground'
                          : t.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-brand-500/10 text-brand-500'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {t.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={() => handleCloseTicket(t.id)}
                        className="inline-flex h-7 px-2.5 items-center gap-1 rounded-lg border text-[11px] font-semibold hover:bg-accent text-muted-foreground"
                      >
                        Close Ticket
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Support Tickets</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Submit a ticket if you need technical assistance or integration support.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Create Support Ticket</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="font-medium">Ticket Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue with WhatsApp template approval"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2">
                    <option value="Technical">Technical Bug</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="AI Engine">AI Engine & Prompts</option>
                    <option value="Integration">WhatsApp / SMS Integration</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium">Priority Level</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium">Description & Steps *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the issue in detail..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>

              <div>
                <label className="font-medium">Attach Screenshot / Document</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="file"
                    id="attachment-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <label
                    htmlFor="attachment-input"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-background px-3 font-semibold cursor-pointer hover:bg-accent"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload Attachment
                  </label>
                  {attachmentUrl && <span className="text-[10px] font-bold text-emerald-500">Attached ✔</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
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
