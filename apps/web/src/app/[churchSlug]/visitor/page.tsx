'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { UserCheck, Send, CheckCircle2, ArrowLeft, Loader2, Heart } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicVisitorCheckinPage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [invitedBy, setInvitedBy] = useState('')
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
          formType: 'visitor_checkin',
          data: {
            fullName: fullName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            invitedBy: invitedBy.trim() || 'Walk-in',
            notes: notes.trim() || null,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to check in.')
      }

      setSubmitted(true)
      toast.success('Welcome! Your digital connect card has been received.')
    } catch (err: any) {
      toast.error(err.message ?? 'Check-in error.')
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 mx-auto">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Welcome to Our Family!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We are so thrilled that you worshiped with us today. Our pastoral team and welcome ministers look forward to connecting with you!
            </p>
            <div className="pt-2">
              <Link
                href={`/${churchSlug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-5 text-xs font-semibold text-white hover:bg-purple-500"
              >
                Return to Church Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground">First-Time Guest Connect Card</h1>
                <p className="text-[11px] text-muted-foreground">
                  Let us know you were here so we can celebrate and bless you with a pastoral gift.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brother Samuel Adebayo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    placeholder="guest@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">How Did You Hear About Us? / Who Invited You?</label>
                <input
                  type="text"
                  placeholder="e.g. Sister Joy / Instagram / Neighborhood walk-in"
                  value={invitedBy}
                  onChange={(e) => setInvitedBy(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Prayer Needs or Comments</label>
                <textarea
                  rows={3}
                  placeholder="How can we pray with you or assist your spiritual journey?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !fullName.trim()}
                className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-purple-600 font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Digital Connect Card
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
