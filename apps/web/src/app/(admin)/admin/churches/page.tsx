'use client'

import { useState, useEffect } from 'react'
import { Building2, Search, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

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
      const res = await adminFetch('/api/admin/churches')
      const data = await res.json()
      if (res.ok && data.success) {
        setChurches(data.churches ?? [])
      } else {
        toast.error(data.error ?? 'Could not load church list.')
      }
    } catch (err: any) {
      console.error('[ADMIN_CHURCHES] Error loading church list:', err)
      toast.error(`Could not load church list: ${err.message ?? 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (churchId: string, plan: string) => {
    setUpdatingId(churchId)
    try {
      const res = await adminFetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, plan }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Subscription tier updated to ${plan.toUpperCase()}!`)
        setChurches((prev) => prev.map((c) => (c.id === churchId ? { ...c, plan } : c)))
      } else {
        toast.error(data.error ?? 'Failed to update plan.')
      }
    } catch (err: any) {
      toast.error(`Failed to update plan: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleStatus = async (churchId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    setUpdatingId(churchId)
    try {
      const res = await adminFetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, status: nextStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Church status updated to ${nextStatus.toUpperCase()}!`)
        setChurches((prev) => prev.map((c) => (c.id === churchId ? { ...c, status: nextStatus } : c)))
      } else {
        toast.error(data.error ?? 'Failed to update status.')
      }
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredChurches = churches.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Church Tenant Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage onboarded church tenants, subscription tiers (Free Trial, Starter, Growth, Enterprise), and status.
          </p>
        </div>
        <button
          type="button"
          onClick={loadChurches}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Search churches by name, slug, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-xl border-none bg-transparent text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : filteredChurches.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
          <Building2 className="h-10 w-10 text-brand-500" />
          <h3 className="font-display text-base font-bold text-foreground">No Church Tenants Found</h3>
          <p className="text-muted-foreground max-w-sm">
            {search ? 'No church matches your search query.' : 'When church administrators complete onboarding registration, their tenant profiles will render here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Church Name</th>
                <th className="p-3.5">Slug / ID</th>
                <th className="p-3.5">Members &amp; Guests</th>
                <th className="p-3.5">Subscription Tier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChurches.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{c.name}</td>
                  <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{c.slug || c.id}</td>
                  <td className="p-3.5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.membersCount ?? 0}</span> members ·{' '}
                    <span className="font-semibold text-foreground">{c.visitorsCount ?? 0}</span> visitors
                  </td>
                  <td className="p-3.5">
                    <select
                      value={c.plan ?? 'free_trial'}
                      onChange={(e) => handleUpdatePlan(c.id, e.target.value)}
                      disabled={updatingId === c.id}
                      className="rounded-xl border bg-background px-2.5 py-1 text-xs font-semibold uppercase text-brand-500"
                    >
                      <option value="free_trial">Free Trial</option>
                      <option value="starter">Starter Plan</option>
                      <option value="growth">Growth Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'suspended' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {c.status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.status)}
                      disabled={updatingId === c.id}
                      className={`rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        c.status === 'suspended'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                      }`}
                    >
                      {c.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
  )
}
