'use client'

import { useState, useEffect } from 'react'
import {
  HandshakeIcon,
  Plus,
  Loader2,
  Trash2,
  X,
  DollarSign,
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

export default function PartnershipsPage() {
  const { church } = useChurchStore()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [tier, setTier] = useState('Covenant Partner')
  const [pledge, setPledge] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadPartners()
  }, [church?.id])

  async function loadPartners() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'partnerships'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setPartners(list)
    } catch (err) {
      console.error('Error loading partners:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !name.trim() || !pledge) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'partnerships'), {
        name: name.trim(),
        tier,
        pledge: Number(pledge),
        status: 'active',
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Ministry partner registered!')
      setShowModal(false)
      setName('')
      setPledge('')
      loadPartners()
    } catch {
      toast.error('Failed to register partner.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Remove this partner record?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'partnerships', id))
      toast.success('Partner removed.')
      setPartners((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to remove partner.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kingdom Partnerships &amp; Pledges
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage vision partners, project pledges, and covenant givers for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-500 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Register Partner
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : partners.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Partner Name</th>
                  <th className="p-3.5">Partnership Tier</th>
                  <th className="p-3.5">Monthly Pledge</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-bold">
                          {p.name?.charAt(0)?.toUpperCase() ?? 'P'}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                        {p.tier}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {(p.pledge ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          p.status === 'fulfilled'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-sky-500/10 text-sky-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
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
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <HandshakeIcon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Partners Registered</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Register your vision partners, covenant givers, and kingdom builders here. Use the &quot;Register Partner&quot; button above to get started.
          </p>
        </div>
      )}


      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Register Partner</h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <form onSubmit={handleAddPartner} className="space-y-3">
              <div>
                <label className="font-semibold">Partner Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elder Samuel Adeyemi"
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="font-semibold">Partnership Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Covenant Partner">Covenant Partner</option>
                  <option value="Kingdom Builder">Kingdom Builder</option>
                  <option value="Visionary Pillar">Visionary Pillar</option>
                  <option value="Foundation Partner">Foundation Partner</option>
                </select>
              </div>
              <div>
                <label className="font-semibold">Pledge Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pledge}
                  onChange={(e) => setPledge(e.target.value)}
                  placeholder="e.g. 50000"
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
