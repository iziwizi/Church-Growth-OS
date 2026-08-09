'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Zap,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Loader2,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

const DEFAULT_PLANS = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    badge: '14-Day Full Access',
    price: '₦0',
    usdPrice: '$0',
    priceNumNgn: 0,
    priceNumUsd: 0,
    period: 'for 14 days',
    description: 'Complete trial experience for churches exploring Church Growth OS.',
    features: [
      'Up to 100 Members & Visitors',
      '2,500 AI Content Credits',
      '1 Satellite Branch',
      'Autonomous & Approval Modes',
      'WhatsApp & Email Broadcasts',
      'Basic Growth Analytics',
      'Standard Email Support',
    ],
    storage: '5 GB Cloud Storage',
    branches: 1,
    aiCredits: '2,500 Credits',
    buttonText: 'Current Trial Plan',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Growing Churches',
    price: '₦25,000',
    usdPrice: '$30',
    priceNumNgn: 25000,
    priceNumUsd: 30,
    period: 'per month',
    description: 'Essential ministry automation for single-campus churches.',
    features: [
      'Up to 500 Members & Visitors',
      '5,000 AI Content Credits',
      '1 Satellite Branch',
      'Autonomous Follow-up Workflows',
      'WhatsApp, Email & SMS Broadcasts',
      'Live Service Control Room',
      'Standard Support (24h response)',
    ],
    storage: '15 GB Storage',
    branches: 1,
    aiCredits: '5,000 Credits',
    buttonText: 'Upgrade to Starter',
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    badge: 'Most Popular',
    price: '₦55,000',
    usdPrice: '$75',
    priceNumNgn: 55000,
    priceNumUsd: 75,
    period: 'per month',
    description: 'Advanced multi-branch intelligence and autonomous ministry scaling.',
    features: [
      'Up to 2,500 Members & Visitors',
      '15,000 AI Content Credits',
      'Up to 3 Satellite Branches',
      'Autonomous Executive Reports',
      'Unlimited WhatsApp & Email Broadcasts',
      'Custom Sermon Repurposing & AI Studio',
      'Priority Support (2h response)',
    ],
    storage: '50 GB Storage',
    branches: 3,
    aiCredits: '15,000 Credits',
    buttonText: 'Upgrade to Growth',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Multi-Campus Megachurch',
    price: '₦150,000',
    usdPrice: '$200',
    priceNumNgn: 150000,
    priceNumUsd: 200,
    period: 'per month',
    description: 'Custom infrastructure and dedicated engineering support for large ministries.',
    features: [
      'Unlimited Members & Visitors',
      '50,000 AI Content Credits',
      'Unlimited Satellite Branches',
      'Custom White-Label Mobile App',
      'Dedicated Account Engineer',
      'Custom API Integrations',
      '24/7 Phone & Priority SLA Support',
    ],
    storage: '500 GB Storage',
    branches: -1,
    aiCredits: '50,000 Credits',
    buttonText: 'Upgrade to Enterprise',
    highlight: false,
  },
]

export default function PricingPage() {
  const { church, setChurch } = useChurchStore()
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS)
  const [loading, setLoading] = useState(true)
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave' | 'stripe'>('paystack')

  useEffect(() => {
    async function loadDynamicPricing() {
      try {
        const res = await fetch('/api/admin/pricing-plans')
        const data = await res.json()
        if (res.ok && data.success && data.plans) {
          const canonical = data.plans
          const updatedPlans = [
            DEFAULT_PLANS[0], // Free Trial
            {
              id: 'starter',
              name: canonical.starter?.name ?? 'Starter',
              badge: canonical.starter?.badge ?? 'Growing Churches',
              price: `₦${Number(canonical.starter?.priceNgn ?? 45000).toLocaleString()}`,
              usdPrice: `$${Number(canonical.starter?.priceUsd ?? 49).toLocaleString()}`,
              priceNumNgn: Number(canonical.starter?.priceNgn ?? 45000),
              priceNumUsd: Number(canonical.starter?.priceUsd ?? 49),
              period: 'per month',
              description: canonical.starter?.description ?? 'Essential ministry automation for single-campus churches.',
              features: canonical.starter?.features ?? DEFAULT_PLANS[1]!.features,
              storage: '15 GB Storage',
              branches: canonical.starter?.maxBranches ?? 1,
              aiCredits: `${Number(canonical.starter?.aiCredits ?? 5000).toLocaleString()} Credits`,
              buttonText: 'Upgrade to Starter',
              highlight: false,
            },
            {
              id: 'growth',
              name: canonical.growth?.name ?? 'Growth',
              badge: canonical.growth?.badge ?? 'Most Popular',
              price: `₦${Number(canonical.growth?.priceNgn ?? 120000).toLocaleString()}`,
              usdPrice: `$${Number(canonical.growth?.priceUsd ?? 129).toLocaleString()}`,
              priceNumNgn: Number(canonical.growth?.priceNgn ?? 120000),
              priceNumUsd: Number(canonical.growth?.priceUsd ?? 129),
              period: 'per month',
              description: canonical.growth?.description ?? 'Advanced multi-branch intelligence and autonomous ministry scaling.',
              features: canonical.growth?.features ?? DEFAULT_PLANS[2]!.features,
              storage: '50 GB Storage',
              branches: canonical.growth?.maxBranches ?? 5,
              aiCredits: `${Number(canonical.growth?.aiCredits ?? 25000).toLocaleString()} Credits`,
              buttonText: 'Upgrade to Growth',
              highlight: true,
            },
            {
              id: 'enterprise',
              name: canonical.enterprise?.name ?? 'Enterprise',
              badge: canonical.enterprise?.badge ?? 'Mega Ministries & Networks',
              price: `₦${Number(canonical.enterprise?.priceNgn ?? 350000).toLocaleString()}`,
              usdPrice: `$${Number(canonical.enterprise?.priceUsd ?? 399).toLocaleString()}`,
              priceNumNgn: Number(canonical.enterprise?.priceNgn ?? 350000),
              priceNumUsd: Number(canonical.enterprise?.priceUsd ?? 399),
              period: 'per month',
              description: canonical.enterprise?.description ?? 'Bespoke infrastructure, dedicated AI capacity, and unlimited global campuses.',
              features: canonical.enterprise?.features ?? DEFAULT_PLANS[3]!.features,
              storage: '500 GB Storage',
              branches: canonical.enterprise?.maxBranches ?? -1,
              aiCredits: `${Number(canonical.enterprise?.aiCredits ?? 100000).toLocaleString()} Credits`,
              buttonText: 'Upgrade to Enterprise',
              highlight: false,
            },
          ]
          setPlans(updatedPlans)
        }
      } catch (err) {
        console.warn('Using default pricing schema:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDynamicPricing()
  }, [])

  const handleUpgradeClick = (plan: typeof DEFAULT_PLANS[0]) => {
    if (!church) {
      toast.error('Please complete setup before upgrading your subscription.')
      return
    }
    if (plan.id === church.subscription?.planId) {
      toast.info(`Your church is already on the ${plan.name} plan.`)
      return
    }
    setSelectedPlanForCheckout(plan)
  }

  const executePaymentUpgrade = async () => {
    if (!church || !selectedPlanForCheckout) return
    setProcessingPayment(true)
    try {
      const plan = selectedPlanForCheckout
      const paymentId = `pay_${Date.now()}`
      const amount = currency === 'NGN' ? plan.priceNumNgn : plan.priceNumUsd
      const branchesLimit = plan.branches ?? (plan.id === 'enterprise' ? -1 : plan.id === 'growth' ? 3 : 1)
      const aiCreditsTotal = plan.id === 'enterprise' ? 50000 : plan.id === 'growth' ? 15000 : 5000

      // 1. Record Payment Transaction in Firestore
      await setDoc(doc(db, 'payments', paymentId), {
        id: paymentId,
        churchId: church.id,
        churchName: church.name,
        planId: plan.id,
        planName: plan.name,
        amount,
        currency,
        gateway,
        reference: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: 'successful',
        createdAt: serverTimestamp(),
      })

      // 2. Update Church Subscription in Firestore
      const updatedSubscription = {
        ...church.subscription,
        planId: plan.id,
        status: 'active' as const,
        branchesLimit,
        aiCreditsTotal,
        aiCreditsRemaining: (church.subscription?.aiCreditsRemaining ?? 0) + aiCreditsTotal,
      }

      await updateDoc(doc(db, 'churches', church.id), {
        plan: plan.id,
        subscription: updatedSubscription,
        updatedAt: serverTimestamp(),
      })

      // 3. Update Zustand Store immediately — unblocks multi-branch and features
      setChurch({
        ...church,
        plan: plan.id as any,
        subscription: updatedSubscription,
      })

      toast.success(`🎉 Payment Successful! Church Growth OS upgraded to ${plan.name}.`)
      setSelectedPlanForCheckout(null)
    } catch (err) {
      console.error('Upgrade payment error:', err)
      toast.error('Payment processing failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const currentPlanId = church?.subscription?.planId ?? 'free_trial'

  return (
    <div className="space-y-8 py-4 text-xs">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>SaaS Production Subscription Engine</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Simple, Transparent Church Growth Pricing
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Scale your congregation, automate visitor follow-ups, and unlock multi-campus branch management with zero lock-in.
        </p>

        {/* Currency Toggle */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground">Currency:</span>
          <div className="inline-flex rounded-xl border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency('NGN')}
              className={`rounded-lg px-3 py-1 font-bold text-xs transition-all ${
                currency === 'NGN' ? 'bg-brand-600 text-white' : 'text-muted-foreground'
              }`}
            >
              NGN (₦)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`rounded-lg px-3 py-1 font-bold text-xs transition-all ${
                currency === 'USD' ? 'bg-brand-600 text-white' : 'text-muted-foreground'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        /* Pricing Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-xs ${
                  plan.highlight
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : isCurrent
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 min-h-[32px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="border-y py-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-extrabold text-foreground">
                        {currency === 'NGN' ? plan.price : plan.usdPrice}
                      </span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  {/* Core Specs */}
                  <div className="space-y-1.5 text-xs font-semibold">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>AI Credits:</span>
                      <span className="text-foreground">{plan.aiCredits}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Branches:</span>
                      <span className="text-foreground">{plan.branches === -1 || plan.branches === 999 ? 'Unlimited' : plan.branches}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Storage:</span>
                      <span className="text-foreground">{plan.storage}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-2 border-t text-xs">
                    <p className="font-bold text-foreground text-[11px]">Included Features:</p>
                    {plan.features?.map((feat: string) => (
                      <div key={feat} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                        <span className="text-muted-foreground text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleUpgradeClick(plan)}
                    disabled={isCurrent}
                    className={`w-full h-10 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                        : plan.highlight
                        ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-xs'
                        : 'border bg-background hover:bg-accent text-foreground'
                    }`}
                  >
                    {isCurrent ? 'Current Active Plan' : plan.buttonText || 'Upgrade Plan'}
                    {!isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {selectedPlanForCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-5 text-xs"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-500" />
                  <span className="font-bold text-foreground text-sm">Subscribe to {selectedPlanForCheckout.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanForCheckout(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Church Tenant:</span>
                  <span className="font-bold text-foreground">{church?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Amount:</span>
                  <span className="font-mono font-bold text-emerald-500 text-sm">
                    {currency === 'NGN' ? selectedPlanForCheckout.price : selectedPlanForCheckout.usdPrice} / month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch Quota:</span>
                  <span className="font-bold text-foreground">
                    {selectedPlanForCheckout.branches === -1 ? 'Unlimited' : `${selectedPlanForCheckout.branches} Campus`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">Select Payment Gateway</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway('paystack')}
                    className={`rounded-xl border p-2.5 text-center font-bold transition-all ${
                      gateway === 'paystack'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Paystack
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway('flutterwave')}
                    className={`rounded-xl border p-2.5 text-center font-bold transition-all ${
                      gateway === 'flutterwave'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Flutterwave
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway('stripe')}
                    className={`rounded-xl border p-2.5 text-center font-bold transition-all ${
                      gateway === 'stripe'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Stripe
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={executePaymentUpgrade}
                disabled={processingPayment}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
              >
                {processingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {processingPayment ? 'Processing Gateway Payment...' : `Complete ${gateway.toUpperCase()} Checkout`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gateway Architecture Note */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <p className="font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Enterprise Multi-Gateway Payment Architecture
          </p>
          <p className="text-muted-foreground">
            Supports local NGN card &amp; bank transfer via <strong>Paystack</strong> &amp; <strong>Flutterwave</strong>, and international payments via <strong>Stripe</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
