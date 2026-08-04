'use client'

import { useState, useEffect } from 'react'
import { Building2, Search, Loader2, ShieldAlert, CheckCircle2, Zap } from 'lucide-react'
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminChurchesPage() {
  const [churches, setChurches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadChurches()
  }, [])

  async function loadChurches() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'churches'))
      const list: any[] = []
      snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setChurches(list)
    } catch {
      toast.error('Could not load church list.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (churchId: string, plan: string) => {
    setUpdatingId(churchId)
    try {
      await updateDoc(doc(db, 'churches', churchId), {
        plan,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Subscription tier updated to ${plan.toUpperCase()}!`)
      setChurches((prev) => prev.map((c) => (c.id === churchId ? { ...c, plan } : c)))
    } catch {
      toast.error('Failed to update plan.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredChurches = churches.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Church Tenant Management
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage subscriptions (Free, Starter, Growth, Enterprise) and feature availability across onboarded churches.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Search churches by name or slug..."
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
                <th className="p-3.5">Church Name</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Country</th>
                <th className="p-3.5">Subscription Tier</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChurches.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{c.name}</td>
                  <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{c.slug}</td>
                  <td className="p-3.5 text-muted-foreground">{c.branding?.country ?? 'NG'}</td>
                  <td className="p-3.5">
                    <select
                      value={c.plan ?? 'growth'}
                      onChange={(e) => handleUpdatePlan(c.id, e.target.value)}
                      disabled={updatingId === c.id}
                      className="rounded-xl border bg-background px-2.5 py-1 text-xs font-semibold uppercase text-brand-500"
                    >
                      <option value="free">Free Tier</option>
                      <option value="starter">Starter Plan</option>
                      <option value="growth">Growth Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Active Tenant
                    </span>
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
