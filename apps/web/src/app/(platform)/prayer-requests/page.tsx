'use client'

import { useState, useEffect } from 'react'
import { HandHeart, Plus, Search, Loader2, Trash2, CheckCircle2, X, Tag } from 'lucide-react'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function PrayerRequestsPage() {
  const { church } = useChurchStore()
  const [prayers, setPrayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [personName, setPersonName] = useState('')
  const [requestText, setRequestText] = useState('')
  const [category, setCategory] = useState('Healing')

  useEffect(() => {
    if (!church?.id) return
    loadPrayers()
  }, [church?.id])

  async function loadPrayers() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'prayerRequests'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setPrayers(list)
    } catch (err) {
      console.error('Error loading prayers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !requestText.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'prayerRequests'), {
        personName: personName.trim() || 'Anonymous Member',
        request: requestText.trim(),
        category,
        status: 'open',
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Prayer request logged!')
      setShowModal(false)
      setPersonName('')
      setRequestText('')
      loadPrayers()
    } catch {
      toast.error('Failed to log request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!church?.id) return
    const nextStatus = currentStatus === 'open' ? 'answered' : 'open'
    try {
      await updateDoc(doc(db, 'churches', church.id, 'prayerRequests', id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Marked as ${nextStatus}!`)
      setPrayers((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)))
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete prayer request?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'prayerRequests', id))
      toast.success('Prayer request removed.')
      setPrayers((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const filteredPrayers = prayers.filter(
    (p) =>
      p.personName?.toLowerCase().includes(search.toLowerCase()) ||
      p.request?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Congregation Prayer Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage prayer needs and testimonies for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Submit Prayer Request
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prayer requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        </div>
      ) : filteredPrayers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrayers.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-500">
                    {p.category || 'General'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p.id, p.status)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                      p.status === 'answered'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {p.status === 'answered' ? '✔ Answered' : 'Open Need'}
                  </button>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground mt-2">{p.personName}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">{p.request}</p>
              </div>

              <div className="flex items-center justify-end border-t pt-3">
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <HandHeart className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Prayer Requests Logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Submit prayer needs to engage your intercessory team.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Submit Prayer Request</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddPrayer} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Member / Person Name</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Sister Mercy"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2"
                >
                  <option value="Healing">Healing & Deliverance</option>
                  <option value="Financial">Financial Breakthrough</option>
                  <option value="Family">Family & Marriage</option>
                  <option value="Career">Career & Business</option>
                  <option value="General">General Prayer Need</option>
                </select>
              </div>
              <div>
                <label className="font-medium">Prayer Request Details *</label>
                <textarea
                  rows={3}
                  required
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Write the prayer request..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
