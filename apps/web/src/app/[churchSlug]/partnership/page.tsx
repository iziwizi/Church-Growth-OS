'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { HandshakeIcon, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TIERS = ['Covenant Partner', 'Vision Partner', 'Project Partner', 'Prayer Partner']

export default function PublicPartnershipPage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tier, setTier] = useState(TIERS[0])
  const [pledge, setPledge] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !churchSlug) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchSlug,
          formType: 'partnership',
          data: {
            fullName: fullName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            tier,
            pledge: pledge ? Number(pledge) : 0,
            notes: notes.trim() || null,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to submit partnership inquiry.')
      }

      setSubmitted(true)
      toast.success('Thank you for partnering with us!')
    } catch (err: any) {
      toast.error(err.message ?? 'Submission error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-lg mx-auto w-full space-y-6">
        <Link
          href={`/${churchSlug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Church Portal
        </Link>

        {submitted ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Partnership Inquiry Received!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thank you for your heart to partner with this ministry. Our team will follow up with you shortly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setFullName('')
                  setPledge('')
                  setNotes('')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold hover:bg-accent"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500 font-bold">
                <HandshakeIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground">Become a Ministry Partner</h1>
                <p className="text-[11px] text-muted-foreground">
                  Join us in advancing the Kingdom through prayer, giving, and covenant partnership.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brother David"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Partnership Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Monthly Pledge (optional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000"
                  value={pledge}
                  onChange={(e) => setPledge(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Anything you'd like us to know..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !fullName.trim()}
                className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-teal-600 font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Partnership Inquiry
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Powered by Church Growth OS
      </footer>
    </div>
  )
}
