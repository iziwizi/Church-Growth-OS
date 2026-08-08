'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions')
      const data = await res.json()
      if (res.ok && data.success) {
        setSubscriptions(data.subscriptions ?? [])
      } else {
        toast.error(data.error ?? 'Could not load subscriptions.')
      }
    } catch (err: any) {
      toast.error(`Could not load subscriptions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (churchId: string, status: string, planId: string) => {
    setUpdatingId(churchId)
    try {
      const branchesLimit = planId === 'enterprise' ? -1 : planId === 'growth' ? 5 : 1
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, status, planId, branchesLimit }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Subscription status updated to ${status.toUpperCase()} (${planId})!`)
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === churchId ? { ...s, status, planId, branchesLimit } : s))
        )
      } else {
        toast.error(data.error ?? 'Failed to update subscription.')
      }
    } catch (err: any) {
      toast.error(`Failed to update subscription: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            SaaS Subscriptions Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor subscription statuses (Trialing, Active, Past Due, Canceled), quotas, and tier allocations across all tenant churches.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSubscriptions}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
          <CreditCard className="h-10 w-10 text-brand-500" />
          <h3 className="font-display text-base font-bold text-foreground">No Subscriptions Found</h3>
          <p className="text-muted-foreground max-w-sm">
            When church tenants register, their subscription quotas and status will render here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Church Tenant</th>
                <th className="p-3.5">Current Plan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Branch Limit</th>
                <th className="p-3.5">AI Credits Left</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{s.churchName}</td>
                  <td className="p-3.5 text-brand-500 font-semibold capitalize">{s.planId.replace('_', ' ')}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                        s.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : s.status === 'trialing'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {s.branchesLimit === -1 ? 'Unlimited' : `${s.branchesLimit} Campus`}
                  </td>
                  <td className="p-3.5 font-mono text-muted-foreground">{s.aiCreditsRemaining?.toLocaleString()}</td>
                  <td className="p-3.5 text-right">
                    <select
                      value={`${s.planId}:${s.status}`}
                      onChange={(e) => {
                        const [p, stat] = e.target.value.split(':')
                        handleUpdateStatus(s.id, stat!, p!)
                      }}
                      disabled={updatingId === s.id}
                      className="rounded-xl border bg-background px-2 py-1 text-xs font-semibold text-foreground"
                    >
                      <option value="free_trial:trialing">Set Free Trial</option>
                      <option value="starter:active">Set Active (Starter)</option>
                      <option value="growth:active">Set Active (Growth)</option>
                      <option value="enterprise:active">Set Active (Enterprise)</option>
                      <option value="starter:past_due">Set Past Due</option>
                      <option value="free_trial:canceled">Cancel Subscription</option>
                    </select>
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
