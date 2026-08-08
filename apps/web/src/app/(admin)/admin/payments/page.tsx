'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Loader2, RefreshCw, CheckCircle2, ShieldCheck, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPaymentsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  const [credentials, setCredentials] = useState({
    paystackPublicKey: '',
    paystackSecret: '',
    flutterwavePublicKey: '',
    flutterwaveSecret: '',
    stripePublicKey: '',
    stripeSecret: '',
    stripeWebhookSecret: '',
  })

  useEffect(() => {
    loadPaymentsData()
  }, [])

  async function loadPaymentsData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments')
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.credentials) setCredentials((prev) => ({ ...prev, ...data.credentials }))
        if (data.transactions) setTransactions(data.transactions)
      } else {
        toast.error(data.error ?? 'Failed to load payment settings.')
      }
    } catch (err: any) {
      toast.error(`Failed to load payment settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('💳 Payment Gateway credentials saved securely to server!')
      } else {
        toast.error(data.error ?? 'Failed to save payment gateway settings.')
      }
    } catch (err: any) {
      toast.error(`Failed to save payment gateway settings: ${err.message}`)
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
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payment Gateways &amp; Platform Transactions
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure multi-gateway credentials (Paystack, Flutterwave, Stripe) and audit SaaS subscription receipts.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPaymentsData}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSaveCredentials} className="space-y-6">
        {/* Gateway Credentials Matrix */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Gateway Integration Credentials
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Server-Side Masked Storage
            </div>
          </div>

          {/* Paystack */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <h3 className="font-bold text-foreground">1. Paystack Gateway (Nigeria / West Africa)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Paystack Public Key</label>
                <input
                  type="text"
                  placeholder="pk_live_..."
                  value={credentials.paystackPublicKey}
                  onChange={(e) => setCredentials({ ...credentials, paystackPublicKey: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold">Paystack Secret Key</label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  value={credentials.paystackSecret}
                  onChange={(e) => setCredentials({ ...credentials, paystackSecret: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Flutterwave */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <h3 className="font-bold text-foreground">2. Flutterwave Gateway (Pan-Africa)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold">Flutterwave Public Key</label>
                <input
                  type="text"
                  placeholder="FLWPUBK_..."
                  value={credentials.flutterwavePublicKey}
                  onChange={(e) => setCredentials({ ...credentials, flutterwavePublicKey: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold">Flutterwave Secret Key</label>
                <input
                  type="password"
                  placeholder="FLWSECK_..."
                  value={credentials.flutterwaveSecret}
                  onChange={(e) => setCredentials({ ...credentials, flutterwaveSecret: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <h3 className="font-bold text-foreground">3. Stripe Gateway (International USD / GBP / EUR)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="font-semibold">Stripe Publishable Key</label>
                <input
                  type="text"
                  placeholder="pk_live_..."
                  value={credentials.stripePublicKey}
                  onChange={(e) => setCredentials({ ...credentials, stripePublicKey: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold">Stripe Secret Key</label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  value={credentials.stripeSecret}
                  onChange={(e) => setCredentials({ ...credentials, stripeSecret: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold">Stripe Webhook Secret</label>
                <input
                  type="password"
                  placeholder="whsec_..."
                  value={credentials.stripeWebhookSecret}
                  onChange={(e) => setCredentials({ ...credentials, stripeWebhookSecret: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Payment Gateways
            </button>
          </div>
        </div>
      </form>

      {/* Platform Transactions Table */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-brand-500" />
          Recent Subscription Transactions
        </h2>

        {transactions.length === 0 ? (
          <div className="rounded-xl border bg-muted/20 p-8 text-center text-muted-foreground">
            No payments recorded yet. Tenant subscription checkouts will populate here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Reference / ID</th>
                  <th className="p-3">Church Tenant</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Gateway</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{tx.reference}</td>
                    <td className="p-3 font-bold text-foreground">{tx.churchName}</td>
                    <td className="p-3 font-semibold text-brand-500">{tx.planName}</td>
                    <td className="p-3 font-bold text-foreground">
                      {tx.currency === 'USD' ? `$${tx.amount}` : `₦${tx.amount?.toLocaleString()}`}
                    </td>
                    <td className="p-3 uppercase font-semibold text-muted-foreground">{tx.gateway}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
