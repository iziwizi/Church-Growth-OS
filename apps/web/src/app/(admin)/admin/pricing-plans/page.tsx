'use client'

import { useState, useEffect } from 'react'
import { Tag, Save, Loader2, Plus, Sparkles, Check } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminPricingPlansPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState({
    starter: { name: 'Starter Plan', priceNgn: 45000, priceUsd: 49, maxBranches: 1, aiCredits: 5000 },
    growth: { name: 'Growth Plan', priceNgn: 120000, priceUsd: 129, maxBranches: 5, aiCredits: 25000 },
    enterprise: { name: 'Enterprise Plan', priceNgn: 350000, priceUsd: 399, maxBranches: -1, aiCredits: 100000 },
  })

  useEffect(() => {
    async function loadPricing() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'system', 'pricing')).catch(() => null)
        if (snap && snap.exists()) {
          setPlans((prev) => ({ ...prev, ...snap.data() }))
        }
      } catch {
        toast.error('Failed to load pricing configuration.')
      } finally {
        setLoading(false)
      }
    }
    loadPricing()
  }, [])

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'system', 'pricing'), {
        ...plans,
        updatedAt: serverTimestamp(),
      })
      toast.success('🎉 Pricing tiers & quotas updated in Firestore!')
    } catch {
      toast.error('Failed to save pricing plans.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pricing Plans &amp; Quotas Manager
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure subscription fees, branch quotas, and AI token allocations dynamically across Starter, Growth, and Enterprise tiers.
        </p>
      </div>

      <form onSubmit={handleSavePricing} className="space-y-6 text-xs">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Starter Plan */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-foreground text-base">Starter Tier</span>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-500">1 Campus</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold">Plan Name</label>
                <input
                  type="text"
                  value={plans.starter.name}
                  onChange={(e) => setPlans({ ...plans, starter: { ...plans.starter, name: e.target.value } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">Price (NGN ₦)</label>
                  <input
                    type="number"
                    value={plans.starter.priceNgn}
                    onChange={(e) => setPlans({ ...plans, starter: { ...plans.starter, priceNgn: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold">Price (USD $)</label>
                  <input
                    type="number"
                    value={plans.starter.priceUsd}
                    onChange={(e) => setPlans({ ...plans, starter: { ...plans.starter, priceUsd: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold">Max Branches Limit</label>
                <input
                  type="number"
                  value={plans.starter.maxBranches}
                  onChange={(e) => setPlans({ ...plans, starter: { ...plans.starter, maxBranches: parseInt(e.target.value) || 1 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-semibold">AI Credits Allocation</label>
                <input
                  type="number"
                  value={plans.starter.aiCredits}
                  onChange={(e) => setPlans({ ...plans, starter: { ...plans.starter, aiCredits: parseInt(e.target.value) || 5000 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="rounded-2xl border-2 border-brand-500 bg-card p-6 shadow-xs space-y-4 relative">
            <div className="absolute -top-3 right-4 rounded-full bg-brand-500 px-3 py-0.5 text-[10px] font-bold text-white">
              POPULAR
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-foreground text-base">Growth Tier</span>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-500">5 Campuses</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold">Plan Name</label>
                <input
                  type="text"
                  value={plans.growth.name}
                  onChange={(e) => setPlans({ ...plans, growth: { ...plans.growth, name: e.target.value } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">Price (NGN ₦)</label>
                  <input
                    type="number"
                    value={plans.growth.priceNgn}
                    onChange={(e) => setPlans({ ...plans, growth: { ...plans.growth, priceNgn: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold">Price (USD $)</label>
                  <input
                    type="number"
                    value={plans.growth.priceUsd}
                    onChange={(e) => setPlans({ ...plans, growth: { ...plans.growth, priceUsd: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold">Max Branches Limit</label>
                <input
                  type="number"
                  value={plans.growth.maxBranches}
                  onChange={(e) => setPlans({ ...plans, growth: { ...plans.growth, maxBranches: parseInt(e.target.value) || 5 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-semibold">AI Credits Allocation</label>
                <input
                  type="number"
                  value={plans.growth.aiCredits}
                  onChange={(e) => setPlans({ ...plans, growth: { ...plans.growth, aiCredits: parseInt(e.target.value) || 25000 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-foreground text-base">Enterprise Tier</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500">Unlimited</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold">Plan Name</label>
                <input
                  type="text"
                  value={plans.enterprise.name}
                  onChange={(e) => setPlans({ ...plans, enterprise: { ...plans.enterprise, name: e.target.value } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">Price (NGN ₦)</label>
                  <input
                    type="number"
                    value={plans.enterprise.priceNgn}
                    onChange={(e) => setPlans({ ...plans, enterprise: { ...plans.enterprise, priceNgn: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold">Price (USD $)</label>
                  <input
                    type="number"
                    value={plans.enterprise.priceUsd}
                    onChange={(e) => setPlans({ ...plans, enterprise: { ...plans.enterprise, priceUsd: parseInt(e.target.value) || 0 } })}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold">Max Branches Limit (-1 for Unlimited)</label>
                <input
                  type="number"
                  value={plans.enterprise.maxBranches}
                  onChange={(e) => setPlans({ ...plans, enterprise: { ...plans.enterprise, maxBranches: parseInt(e.target.value) || -1 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-semibold">AI Credits Allocation</label>
                <input
                  type="number"
                  value={plans.enterprise.aiCredits}
                  onChange={(e) => setPlans({ ...plans, enterprise: { ...plans.enterprise, aiCredits: parseInt(e.target.value) || 100000 } })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Pricing Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
