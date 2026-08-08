'use client'

import { useState, useEffect } from 'react'
import {
  UserPlus,
  Search,
  Plus,
  Upload,
  Loader2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  UserCheck,
  X,
  RefreshCw,
} from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'
import VisitorImportWizard from './ImportWizard'

export default function VisitorsPage() {
  const { church } = useChurchStore()
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [invitedBy, setInvitedBy] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]!)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadVisitors()
  }, [church?.id])

  async function loadVisitors() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'visitors'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setVisitors(list)
    } catch (err) {
      console.error('Error loading visitors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !fullName.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'visitors'), {
        fullName: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        invitedBy: invitedBy.trim() || null,
        visitDate,
        followUpStatus: status,
        notes: notes.trim() || null,
        churchId: church.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('🎉 First-time visitor logged!')
      setShowModal(false)
      setFullName('')
      setEmail('')
      setPhone('')
      setInvitedBy('')
      setNotes('')
      loadVisitors()
    } catch {
      toast.error('Failed to log visitor.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete visitor record?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'visitors', id))
      toast.success('Visitor removed.')
      setVisitors((prev) => prev.filter((v) => v.id !== id))
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const filteredVisitors = visitors.filter((v) => {
    const matchSearch =
      v.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search)
    const matchStage = stageFilter === 'all' || (v.followUpStatus || 'new') === stageFilter
    return matchSearch && matchStage
  })

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Visitor Tracking &amp; Guest Pipeline
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track first-time guests, nurture relationship milestones, and trigger automated welcome messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportWizard(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 font-semibold text-purple-500 hover:bg-purple-500/20 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import Visitors
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Visitor
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground ml-1" />
          <input
            type="text"
            placeholder="Search visitors by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border-none bg-transparent text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-8 rounded-lg border bg-background px-2.5 text-xs font-semibold text-muted-foreground"
          >
            <option value="all">All Stages</option>
            <option value="new">New Guests</option>
            <option value="follow_up">In Follow-Up</option>
            <option value="converted">Converted to Member</option>
          </select>
          <button
            type="button"
            onClick={loadVisitors}
            className="p-1.5 rounded-lg border bg-background text-muted-foreground hover:bg-accent"
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
          <UserCheck className="h-10 w-10 text-purple-500" />
          <h3 className="font-display text-base font-bold text-foreground">No Visitors Found</h3>
          <p className="text-muted-foreground max-w-sm">
            {search || stageFilter !== 'all'
              ? 'No visitors match the current filter query.'
              : 'Log Sunday service first-time attendees or import bulk guest registries to start automated follow-up workflows.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Visitor Name</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Visit Date</th>
                <th className="p-3.5">Invited By</th>
                <th className="p-3.5">Follow-Up Stage</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{v.fullName}</td>
                  <td className="p-3.5 text-muted-foreground space-y-0.5">
                    {v.phone && (
                      <p className="font-mono text-[11px] flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" /> {v.phone}
                      </p>
                    )}
                    {v.email && (
                      <p className="text-[11px] flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {v.email}
                      </p>
                    )}
                  </td>
                  <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{v.visitDate || '—'}</td>
                  <td className="p-3.5 text-muted-foreground">{v.invitedBy || 'Walk-in'}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        v.followUpStatus === 'converted'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : v.followUpStatus === 'follow_up'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {v.followUpStatus || 'New'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                      title="Delete visitor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Log First-Time Visitor</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleAddVisitor} className="space-y-3">
              <div>
                <label className="font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Visitor's full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="visitor@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">Visit Date</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-semibold">Invited By (Optional)</label>
                  <input
                    type="text"
                    placeholder="Member name or Social"
                    value={invitedBy}
                    onChange={(e) => setInvitedBy(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold">Prayer Request / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any specific prayer request or ministry interest..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-8 rounded-xl border px-3">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-8 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Import Wizard Modal */}
      {showImportWizard && church?.id && (
        <VisitorImportWizard
          churchId={church.id}
          onClose={() => setShowImportWizard(false)}
          onImportComplete={() => {
            loadVisitors()
          }}
        />
      )}
    </div>
  )
}
