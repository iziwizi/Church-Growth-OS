'use client'

import { useState, useEffect } from 'react'
import { Tag, Save, Loader2, Plus, Sparkles, Check, Trash2, Edit3, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface PlanTier {
  id: string
  name: string
  priceNgn: number
  priceUsd: number
  maxBranches: number
  aiCredits: number
  description?: string
  features: string[]
}

export default function AdminPricingPlansPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newFeatureText, setNewFeatureText] = useState<{ [key: string]: string }>({
    starter: '',
    growth: '',
    enterprise: '',
  })

  const [plans, setPlans] = useState<{
    starter: PlanTier
    growth: PlanTier
    enterprise: PlanTier
  }>({
    starter: {
      id: 'starter',
      name: 'Starter Plan',
      priceNgn: 45000,
      priceUsd: 49,
      maxBranches: 1,
      aiCredits: 5000,
      description: 'Essential ministry automation for single-campus churches.',
      features: [
        'Up to 500 Members & Visitors',
        '5,000 AI Content Credits / Month',
        '1 Satellite Branch',
        'Autonomous Follow-up Workflows',
        'WhatsApp, Email & SMS Broadcasts',
        'Live Service Control Room',
        'Church Store (Books, Sermons, Tickets)',
        'Daily 6:00 AM Growth Report',
      ],
    },
    growth: {
      id: 'growth',
      name: 'Growth Plan',
      priceNgn: 120000,
      priceUsd: 129,
      maxBranches: 5,
      aiCredits: 25000,
      description: 'Advanced multi-branch intelligence and autonomous ministry scaling.',
      features: [
        'Up to 2,500 Members & Visitors',
        '25,000 AI Content Credits / Month',
        'Up to 5 Satellite Branches',
        'Autonomous Executive Growth Reports',
        'Priority WhatsApp & Email Delivery',
        'Full AI Studio & Sermon Repurposing',
        'Church Store with Digital Downloads',
        'Multi-User Roles & Permissions Matrix',
      ],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise Plan',
      priceNgn: 350000,
      priceUsd: 399,
      maxBranches: -1,
      aiCredits: 100000,
      description: 'Bespoke infrastructure, dedicated AI capacity, and unlimited global campuses.',
      features: [
        'Unlimited Members & Visitors',
        '100,000 AI Content Credits / Month',
        'Unlimited Satellite Branches & Campuses',
        'Dedicated Custom AI Fine-Tuning',
        'Church-Owned WhatsApp Business API (WABA)',
        'Custom Dedicated SMS Sender ID',
        'Multi-Campus Financial Consolidation',
        '24/7 Dedicated Account Manager',
      ],
    },
  })

  useEffect(() => {
    loadPricing()
  }, [])

  async function loadPricing() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing-plans')
      const data = await res.json()
      if (res.ok && data.success && data.plans) {
        setPlans(data.plans)
      } else {
        toast.error('Could not load pricing configuration.')
      }
    } catch {
      toast.error('Failed to connect to pricing service.')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plans),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('🎉 Pricing tiers & features saved securely to server!')
        await loadPricing()
      } else {
        toast.error(data.error ?? 'Failed to save pricing plans.')
      }
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addFeature = (tierKey: 'starter' | 'growth' | 'enterprise') => {
    const text = newFeatureText[tierKey]?.trim()
    if (!text) return
    setPlans({
      ...plans,
      [tierKey]: {
        ...plans[tierKey],
        features: [...plans[tierKey].features, text],
      },
    })
    setNewFeatureText({ ...newFeatureText, [tierKey]: '' })
  }

  const removeFeature = (tierKey: 'starter' | 'growth' | 'enterprise', index: number) => {
    const updated = [...plans[tierKey].features]
    updated.splice(index, 1)
    setPlans({
      ...plans,
      [tierKey]: {
        ...plans[tierKey],
        features: updated,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pricing Plans &amp; Quotas Manager
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Single source of truth for subscription fees, campus quotas, AI tokens, and features across Starter, Growth, and Enterprise tiers.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPricing}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reload Canonical Plans
        </button>
      </div>

      <form onSubmit={handleSavePricing} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(['starter', 'growth', 'enterprise'] as const).map((tierKey) => {
            const plan = plans[tierKey]
            const isEnterprise = tierKey === 'enterprise'
            const isGrowth = tierKey === 'growth'

            return (
              <div
                key={tierKey}
                className={`rounded-2xl border bg-card p-6 shadow-xs space-y-4 ${
                  isGrowth ? 'ring-2 ring-brand-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="font-display font-bold text-foreground text-base capitalize">
                    {plan.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isEnterprise
                        ? 'bg-purple-500/10 text-purple-600'
                        : isGrowth
                        ? 'bg-brand-500/10 text-brand-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isEnterprise ? 'Unlimited Campuses' : isGrowth ? 'Multi-Branch' : 'Single Campus'}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Plan Name */}
                  <div>
                    <label className="font-semibold text-foreground">Plan Name</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) =>
                        setPlans({
                          ...plans,
                          [tierKey]: { ...plan, name: e.target.value },
                        })
                      }
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                      required
                    />
                  </div>

                  {/* Pricing NGN & USD */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-foreground">Price (NGN ₦)</label>
                      <input
                        type="number"
                        value={plan.priceNgn}
                        onChange={(e) =>
                          setPlans({
                            ...plans,
                            [tierKey]: { ...plan, priceNgn: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">Price (USD $)</label>
                      <input
                        type="number"
                        value={plan.priceUsd}
                        onChange={(e) =>
                          setPlans({
                            ...plans,
                            [tierKey]: { ...plan, priceUsd: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Campus & AI Credit Limits */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-foreground">Max Campuses</label>
                      <input
                        type="number"
                        value={plan.maxBranches}
                        onChange={(e) =>
                          setPlans({
                            ...plans,
                            [tierKey]: { ...plan, maxBranches: parseInt(e.target.value) || 0 },
                          })
                        }
                        placeholder="-1 for unlimited"
                        className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                        required
                      />
                      <span className="text-[9px] text-muted-foreground">-1 = unlimited</span>
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">AI Credits / Mo</label>
                      <input
                        type="number"
                        value={plan.aiCredits}
                        onChange={(e) =>
                          setPlans({
                            ...plans,
                            [tierKey]: { ...plan, aiCredits: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Plan Description */}
                  <div>
                    <label className="font-semibold text-foreground">Tagline / Description</label>
                    <input
                      type="text"
                      value={plan.description ?? ''}
                      onChange={(e) =>
                        setPlans({
                          ...plans,
                          [tierKey]: { ...plan, description: e.target.value },
                        })
                      }
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 text-xs"
                    />
                  </div>

                  {/* Features List Manager */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Included Features ({plan.features.length})</span>
                    </label>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {plan.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-1.5 rounded-lg border bg-muted/20 px-2.5 py-1 text-[11px]"
                        >
                          <span className="truncate text-foreground flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            {feature}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFeature(tierKey, idx)}
                            className="text-muted-foreground hover:text-rose-500 shrink-0 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Feature input */}
                    <div className="flex items-center gap-1 pt-1">
                      <input
                        type="text"
                        placeholder="Add new feature..."
                        value={newFeatureText[tierKey] || ''}
                        onChange={(e) =>
                          setNewFeatureText({ ...newFeatureText, [tierKey]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addFeature(tierKey)
                          }
                        }}
                        className="flex h-8 w-full rounded-lg border bg-background px-2.5 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => addFeature(tierKey)}
                        className="h-8 rounded-lg bg-brand-600 px-2.5 text-[11px] font-semibold text-white hover:bg-brand-500 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Canonical Pricing Plans
          </button>
        </div>
      </form>
    </div>
  )
}
