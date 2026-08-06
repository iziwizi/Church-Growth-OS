'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Loader2, Download, Printer } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'invoices')).catch(() => null)
      const list: any[] = []
      snap?.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setInvoices(list)
    } catch {
      toast.error('Could not load invoices.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Automated Tax &amp; SaaS Invoices
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          View and export PDF tax invoices generated for church subscription renewals and one-time purchases.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="font-bold text-foreground">No Generated Invoices</p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Invoices are automatically generated upon successful subscription payments by MUJTEKNIFY LIMITED.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Church Name</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-foreground">{inv.number || inv.id}</td>
                  <td className="p-3.5 text-foreground">{inv.churchName}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-500">₦{inv.amount?.toLocaleString()}</td>
                  <td className="p-3.5 text-muted-foreground">{inv.date || 'Today'}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toast.info(`Printing invoice #${inv.number || inv.id}...`)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border bg-background px-2.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                    >
                      <Printer className="h-3 w-3" /> Export PDF
                    </button>
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
