'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, ArrowLeft, Heart, CheckCircle2, Copy, Building, ShieldCheck, ExternalLink, Info } from 'lucide-react'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function PublicDonatePage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [church, setChurch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('5000')
  const [category, setCategory] = useState('Tithe')
  const [copiedAccount, setCopiedAccount] = useState(false)

  useEffect(() => {
    if (!churchSlug) return
    async function loadChurch() {
      try {
        const q = query(
          collection(db, 'churches'),
          where('slug', '==', churchSlug.toLowerCase().trim()),
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          setChurch({ id: snap.docs[0]!.id, ...snap.docs[0]!.data() })
        }
      } catch (err) {
        console.error('Error loading church for giving:', err)
      } finally {
        setLoading(false)
      }
    }
    loadChurch()
  }, [churchSlug])

  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc)
    setCopiedAccount(true)
    toast.success('Account number copied to clipboard!')
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  // Church admins configure giving destinations under Settings → Giving &
  // Payment, which persists to `church.giving.*` — a previous version of
  // this page read `church.settings.bankAccount`, a path nothing ever
  // wrote to, so every donor saw a fabricated dummy GTBank account instead
  // of the church's real details (docs/PRODUCTION_ENGINEERING_AUDIT.md §8).
  const giving = church?.giving ?? {}
  const hasBankDetails = !!(giving.bankName && giving.accountNumber)
  const paymentLinks = [
    { label: 'Pay with Paystack', url: giving.paystackLink },
    { label: 'Pay with Flutterwave', url: giving.flutterwaveLink },
    { label: 'Pay with PayPal', url: giving.paypalUrl },
    { label: 'Pay with Stripe', url: giving.stripeLink },
    { label: 'Give Online', url: giving.customGivingUrl },
  ].filter((link) => !!link.url)
  const givingConfigured = hasBankDetails || paymentLinks.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-lg mx-auto w-full space-y-6 text-xs">
        <Link
          href={`/${churchSlug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Church Portal
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-foreground">Tithes &amp; Kingdom Giving</h1>
              <p className="text-[11px] text-muted-foreground">
                Honour the Lord with your substance and the firstfruits of all your increase. (Proverbs 3:9)
              </p>
            </div>
          </div>

          {/* Giving Category Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground">Giving Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Tithe', 'Offering', 'Building Seed', 'Missions'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl border p-2 font-semibold transition-all ${
                    category === cat
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'hover:bg-muted/20 text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {!loading && !givingConfigured && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-2 text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                This church hasn&apos;t configured a giving destination yet. Please contact the church
                directly for how to give.
              </p>
            </div>
          )}

          {paymentLinks.length > 0 && (
            <div className="space-y-2">
              {paymentLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 font-semibold text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          )}

          {/* Bank Transfer Details Card */}
          {hasBankDetails && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-500 text-xs">
                <Building className="h-4 w-4" />
                <span>Direct Bank Transfer Details</span>
              </div>

              <div className="rounded-xl border bg-card p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-bold text-foreground">{giving.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Number:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-500">
                    <span>{giving.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(giving.accountNumber)}
                      className="p-1 rounded-md hover:bg-muted"
                      title="Copy Account Number"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{giving.accountName ?? church?.name}</span>
                </div>
              </div>
            </div>
          )}

          {giving.givingInstructions && (
            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{giving.givingInstructions}</p>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Direct-to-church giving — funds are not processed by Church Growth OS.</span>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Powered by Church Growth OS
      </footer>
    </div>
  )
}
