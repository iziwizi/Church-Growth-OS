'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Growing Churches',
    priceNgn: 45000,
    priceUsd: 49,
    popular: false,
    description: 'Essential ministry automation and visitor follow-up for single-campus churches.',
    features: [
      'Up to 500 Members & Visitors',
      '5,000 AI Content Credits / Month',
      '1 Satellite Branch',
      'Autonomous Follow-up Workflows',
      'WhatsApp, Email & SMS Broadcasts',
      'Live Service Control Room & Preflight',
      'Church Store (Books, Sermons, Tickets)',
      'Daily 6:00 AM Growth Report',
      'Standard Support (24h SLA)',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    badge: 'Most Popular',
    priceNgn: 120000,
    priceUsd: 129,
    popular: true,
    description: 'Advanced multi-branch intelligence and autonomous ministry scaling for growing congregations.',
    features: [
      'Up to 2,500 Members & Visitors',
      '25,000 AI Content Credits / Month',
      'Up to 5 Satellite Branches',
      'Autonomous Executive Growth Reports',
      'Priority WhatsApp & Email Delivery Engine',
      'Full AI Studio & Sermon Repurposing',
      'Church Store with Digital Downloads',
      'Multi-User Roles & Permissions Matrix',
      'Priority Pastoral Support (2h SLA)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    badge: 'Mega Ministries & Networks',
    priceNgn: 350000,
    priceUsd: 399,
    popular: false,
    description: 'Bespoke infrastructure, dedicated AI capacity, and unlimited global campus networks.',
    features: [
      'Unlimited Members & Visitors',
      '100,000 AI Content Credits / Month',
      'Unlimited Satellite Branches & Campuses',
      'Dedicated Custom AI Fine-Tuning',
      'Church-Owned WhatsApp Business API (WABA)',
      'Custom Dedicated SMS Sender ID',
      'Multi-Campus Financial Consolidation',
      '24/7 Dedicated Account Manager',
      '99.9% Uptime SLA & Custom Domain Routing',
    ],
  },
]

export function PricingSection() {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          {PLANS.map((plan) => {
            const formattedPrice =
              currency === 'NGN'
                ? `₦${plan.priceNgn.toLocaleString()}`
                : `$${plan.priceUsd}`

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-brand-500 bg-card shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/30'
                    : 'border border-border/80 bg-card/60 hover:border-border shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-1 text-[11px] font-extrabold text-white shadow-md uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      {!plan.popular && (
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
                      plan.popular
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:scale-[1.02]'
                        : 'border border-border/80 bg-muted/40 text-foreground hover:bg-accent'
                    }`}
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
