'use client'

import { useState, useEffect } from 'react'
import { Gift, Plus, Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react'
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(20)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'coupons')).catch(() => null)
      const list: any[] = []
      snap?.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setCoupons(list)
    } catch {
      toast.error('Could not load promo codes.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setAdding(true)
    try {
      const couponId = code.trim().toUpperCase()
      await setDoc(doc(db, 'coupons', couponId), {
        code: couponId,
        discountPercent,
        status: 'active',
        redemptions: 0,
        createdAt: serverTimestamp(),
      })
      toast.success(`Promo Coupon "${couponId}" created with ${discountPercent}% discount!`)
      setCode('')
      loadCoupons()
    } catch {
      toast.error('Failed to create coupon.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', couponId))
      toast.success(`Coupon ${couponId} deleted.`)
      setCoupons((prev) => prev.filter((c) => c.id !== couponId))
    } catch {
      toast.error('Failed to delete coupon.')
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Promotional Coupons &amp; Discount Codes
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Create promotional codes (e.g. KINGDOM2026, REVIVAL50) for church subscription discounts.
        </p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreateCoupon} className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Gift className="h-4 w-4 text-brand-500" />
          Create New Promo Code
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="font-semibold">Coupon Code (Uppercase)</label>
            <input
              type="text"
              required
              placeholder="e.g. GRACE50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono uppercase"
            />
          </div>
          <div>
            <label className="font-semibold">Discount Percentage (%)</label>
            <input
              type="number"
              min={5}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 10)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create Coupon
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Coupon Code</th>
                <th className="p-3.5">Discount</th>
                <th className="p-3.5">Redemptions</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-mono font-bold text-brand-500">{c.code || c.id}</td>
                  <td className="p-3.5 font-bold text-emerald-500">{c.discountPercent}% OFF</td>
                  <td className="p-3.5 text-muted-foreground">{c.redemptions ?? 0} uses</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
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
