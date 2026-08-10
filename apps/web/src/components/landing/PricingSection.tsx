'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { DEFAULT_CANONICAL_PLANS, type PlanConfig } from '@/lib/config/pricing-matrix'

export function PricingSection() {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [plans, setPlans] = useState<Record<string, PlanConfig>>(DEFAULT_CANONICAL_PLANS)

  // Fetch canonical live pricing configuration from Super Admin system
  useEffect(() => {
    async function loadCanonicalPricing() {
      try {
        const res = await fetch('/api/admin/pricing-plans')
        if (res.ok) {
          const data = await res.json()
          if (data.plans && typeof data.plans === 'object') {
            setPlans((prev) => ({
              starter: { ...prev.starter, ...data.plans.starter },
              growth: { ...prev.growth, ...data.plans.growth },
              enterprise: { ...prev.enterprise, ...data.plans.enterprise },
            }))
          }
        }
      } catch {
        // Safe graceful fallback to default canonical plans
      }
    }
    loadCanonicalPricing()
  }, [])

  const planList = [plans.starter, plans.growth, plans.enterprise].filter(Boolean)

  return (
    <section id="pricing" className="py-20 sm:py-28 relative overflow-hidden w-full max-w-full">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent Ministry Pricing</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Simple, Transparent Plans for Every Church Stage.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every plan includes a 14-day full feature trial with zero risk. Upgrade or modify your plan anytime from your church settings.
          </p>

          {/* Currency Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="inline-flex items-center p-1 rounded-2xl bg-muted/50 border border-border/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrency('NGN')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  currency === 'NGN'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ₦ NGN (Nigeria)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  currency === 'USD'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                $ USD (International)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {planList.map((plan) => {
            const formattedPrice =
              currency === 'NGN'
                ? `₦${(plan.priceNgn || 0).toLocaleString()}`
                : `$${plan.priceUsd || 0}`

            const isPopular = plan.id === 'growth' || plan.popular

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className={`relative rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? 'border-2 border-brand-500 bg-card shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/30'
                    : 'border border-border/80 bg-card/60 hover:border-border shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-1 text-[11px] font-extrabold text-white shadow-md uppercase tracking-wider">
                    {plan.badge || 'Most Popular'}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      {!isPopular && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        {formattedPrice}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">/ month</span>
                    </div>
                    <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                      Includes 14-Day Free Trial
                    </p>
                  </div>

                  <ul className="space-y-3 text-xs text-foreground/90 font-medium border-t border-border/40 pt-6">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href={`/register?plan=${plan.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold transition-all ${
                      isPopular
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:scale-[1.02]'
                        : 'border border-border/80 bg-muted/40 text-foreground hover:bg-accent'
                    }`}
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
