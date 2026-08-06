'use client'

import { useState, useEffect } from 'react'
import { Receipt, Search, Loader2, DollarSign, CheckCircle2, CreditCard } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'payments')).catch(() => null)
      const list: any[] = []
      snap?.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setPayments(list)
    } catch {
      toast.error('Could not load payment ledger.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(
    (p) =>
      p.churchName?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.gateway?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Payments Ledger
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Audit transaction logs, Paystack / Flutterwave / Stripe payment receipts, and billing history.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Search by church, reference ID, or gateway..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-xl border-none bg-transparent text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3">
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="font-bold text-foreground">No Payment Transactions Recorded</p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Payment transactions processed via Paystack, Flutterwave, or Stripe will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Reference ID</th>
                <th className="p-3.5">Church Tenant</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Gateway</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono text-[11px] font-bold text-foreground">{p.reference || p.id}</td>
                  <td className="p-3.5 text-foreground">{p.churchName}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-500">
                    {p.currency === 'USD' ? '$' : '₦'}
                    {p.amount?.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-semibold capitalize text-brand-500">{p.gateway}</td>
                  <td className="p-3.5 uppercase">{p.planId}</td>
                  <td className="p-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Successful
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
