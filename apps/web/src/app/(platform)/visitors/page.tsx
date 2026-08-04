'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Search, Plus, Filter, Loader2, Trash2, Edit, Mail, Phone, Calendar, CheckCircle2, UserCheck, X } from 'lucide-react'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function VisitorsPage() {
  const { church } = useChurchStore()
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [assignedPastor, setAssignedPastor] = useState('')
  const [status, setStatus] = useState('first_time')

  useEffect(() => {
    if (!church?.id) return
    loadVisitors()
  }, [church?.id])

  async function loadVisitors() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'visitors'), orderBy('createdAt', 'desc'))
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
        email: email.trim(),
        phone: phone.trim(),
        assignedPastor: assignedPastor.trim(),
        status,
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('First-time visitor logged!')
      setShowModal(false)
      setFullName('')
      setEmail('')
      setPhone('')
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

  const filteredVisitors = visitors.filter(
    (v) =>
      v.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Visitor Tracking & Guest Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track first-time guests and automate 7-step follow-up journeys for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          Register First-Time Guest
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guests by name or phone..."
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
      ) : filteredVisitors.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Guest Name</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Assigned Minister</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{v.fullName}</td>
                  <td className="p-3.5 text-muted-foreground">
                    <p>{v.email || 'No email'}</p>
                    <p>{v.phone || 'No phone'}</p>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{v.assignedPastor || 'Unassigned'}</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 capitalize">
                      {v.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <UserPlus className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Visitors Logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Log first-time guests to start automated AI follow-ups.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Log First-Time Guest</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddVisitor} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sister Sarah Connor"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>
              <div>
                <label className="font-medium">Assigned Follow-Up Minister</label>
                <input
                  type="text"
                  value={assignedPastor}
                  onChange={(e) => setAssignedPastor(e.target.value)}
                  placeholder="Pastor James"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
