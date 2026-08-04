'use client'

import { useState } from 'react'
import { HandshakeIcon, Plus, Search, Loader2, Trash2, CheckCircle2, X, DollarSign } from 'lucide-react'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function PartnershipsPage() {
  const { church } = useChurchStore()
  const [partners, setPartners] = useState([
    { id: '1', name: 'Elder Samuel', tier: 'Covenant Partner', pledge: 100000, status: 'fulfilled' },
    { id: '2', name: 'Dr. Elizabeth', tier: 'Kingdom Builder', pledge: 250000, status: 'active' },
  ])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [tier, setTier] = useState('Covenant Partner')
  const [pledge, setPledge] = useState('')

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pledge) return
    setPartners((prev) => [
      { id: Date.now().toString(), name, tier, pledge: Number(pledge), status: 'active' },
      ...prev,
    ])
    toast.success('Ministry partner registered!')
    setShowModal(false)
    setName('')
    setPledge('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kingdom Partnerships & Pledges
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

      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
            <tr>
              <th className="p-3.5">Partner Name</th>
              <th className="p-3.5">Partnership Tier</th>
              <th className="p-3.5">Monthly Pledge</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="p-3.5 font-bold text-foreground">{p.name}</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                    {p.tier}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-foreground">₦{p.pledge.toLocaleString()}</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 capitalize">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Register Partner</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddPartner} className="space-y-3">
              <div>
                <label className="font-semibold">Partner Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-semibold">Partnership Tier</label>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2">
                  <option value="Covenant Partner">Covenant Partner</option>
                  <option value="Kingdom Builder">Kingdom Builder</option>
                  <option value="Visionary Pillar">Visionary Pillar</option>
                </select>
              </div>
              <div>
                <label className="font-semibold">Pledge Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  value={pledge}
                  onChange={(e) => setPledge(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4">Cancel</button>
                <button type="submit" className="h-9 rounded-xl bg-amber-600 px-4 font-semibold text-white">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
