'use client'

import { useState } from 'react'
import { DollarSign, ShieldCheck, Save, Loader2, CreditCard, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminBillingGatewaysPage() {
  const [paystackEnabled, setPaystackEnabled] = useState(true)
  const [flutterwaveEnabled, setFlutterwaveEnabled] = useState(true)
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [defaultProvider, setDefaultProvider] = useState('paystack')
  const [saving, setSaving] = useState(false)

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Payment gateway configuration saved!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Payment Gateways & Billing
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure Paystack, Flutterwave, and Stripe credentials for platform-wide subscription collection.
        </p>
      </div>

      <form onSubmit={handleSaveGateways} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" /> Default Payment Gateway
          </h2>

          <div className="space-y-2 text-xs">
            <label className="font-semibold">Primary Platform Provider</label>
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value)}
              className="flex h-10 w-full rounded-xl border bg-background px-3"
            >
              <option value="paystack">Paystack (Africa / NGN / GHS)</option>
              <option value="flutterwave">Flutterwave (Global / Multi-Currency)</option>
              <option value="stripe">Stripe (US / Europe / International)</option>
            </select>
          </div>
        </div>

        {/* Gateways Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          {/* Paystack */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">Paystack</span>
              <button type="button" onClick={() => setPaystackEnabled(!paystackEnabled)}>
                {paystackEnabled ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">Pay with Card, USSD, Bank Transfer in NGN & GHS.</p>
            <div>
              <label className="font-medium">Secret Key</label>
              <input type="password" defaultValue="sk_live_paystack_***" className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 text-[11px]" />
            </div>
          </div>

          {/* Flutterwave */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">Flutterwave</span>
              <button type="button" onClick={() => setFlutterwaveEnabled(!flutterwaveEnabled)}>
                {flutterwaveEnabled ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">Multi-currency checkout for African and global cards.</p>
            <div>
              <label className="font-medium">Secret Key</label>
              <input type="password" defaultValue="FLWSECK_TEST-***" className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 text-[11px]" />
            </div>
          </div>

          {/* Stripe */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">Stripe</span>
              <button type="button" onClick={() => setStripeEnabled(!stripeEnabled)}>
                {stripeEnabled ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">International USD, EUR, and GBP payments.</p>
            <div>
              <label className="font-medium">Secret Key</label>
              <input type="password" defaultValue="sk_live_stripe_***" className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 text-[11px]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Gateway Settings
          </button>
        </div>
      </form>
    </div>
  )
}
