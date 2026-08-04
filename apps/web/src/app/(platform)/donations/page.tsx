'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, Loader2, Trash2, CheckCircle2, X, TrendingUp, CreditCard, Building } from 'lucide-react'
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function DonationsPage() {
  const { church } = useChurchStore()
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [donorName, setDonorName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Tithe')
  const [branchId, setBranchId] = useState('main')

  useEffect(() => {
    if (!church?.id) return
    loadDonations()
  }, [church?.id])

  async function loadDonations() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'donations'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setDonations(list)
    } catch (err) {
      console.error('Error loading donations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !amount || isNaN(Number(amount))) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'donations'), {
        donorName: donorName.trim() || 'Anonymous Giver',
        amount: Number(amount),
        category,
        branchId,
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Financial contribution logged!')
      setShowModal(false)
      setDonorName('')
      setAmount('')
      loadDonations()
    } catch {
      toast.error('Failed to log donation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete donation entry?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'donations', id))
      toast.success('Entry deleted.')
      setDonations((prev) => prev.filter((d) => d.id !== id))
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const totalGiving = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  const filteredDonations = donations.filter(
    (d) =>
      d.donorName?.toLowerCase().includes(search.toLowerCase()) ||
      d.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Donations & Financial Campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track tithes, offerings, and building fund giving for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Log Contribution
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Giving Recorded</p>
            <p className="font-display text-xl font-bold text-foreground mt-0.5">
              ₦{totalGiving.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 font-bold">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Transactions</p>
            <p className="font-display text-xl font-bold text-foreground mt-0.5">
              {donations.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 font-bold">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Primary Currency</p>
            <p className="font-display text-xl font-bold text-foreground mt-0.5">NGN (₦)</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions by donor or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : filteredDonations.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Donor Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDonations.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{d.donorName}</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                      {d.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground uppercase text-[10px] font-semibold">{d.branchId ?? 'MAIN'}</td>
                  <td className="p-3.5 font-display font-bold text-foreground">₦{Number(d.amount).toLocaleString()}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
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
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Financial Entries Logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Log tithes, offerings, or project pledges.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Log Financial Contribution</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddDonation} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Donor Name</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Brother David"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium">Amount (NGN) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50000"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2"
                  >
                    <option value="Tithe">Tithe</option>
                    <option value="Offering">Sunday Offering</option>
                    <option value="Building Fund">Building Fund</option>
                    <option value="Missions">Missions & Evangelism</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-medium">Branch ID</label>
                <input
                  type="text"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  placeholder="main"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Log Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
