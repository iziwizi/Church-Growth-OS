'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { HandHeart, Send, CheckCircle2, ArrowLeft, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicPrayerRequestPage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [request, setRequest] = useState('')
  const [category, setCategory] = useState('Healing & Health')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim() || !churchSlug) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchSlug,
          formType: 'prayer_request',
          data: {
            fullName: fullName.trim() || 'Anonymous',
            email: email.trim() || null,
            phone: phone.trim() || null,
            request: request.trim(),
            category,
            isPrivate,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to submit prayer request.')
      }

      setSubmitted(true)
      toast.success('Your prayer request has been sent to our prayer team.')
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Prayer Request Received</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;The prayer of a righteous person is powerful and effective.&rdquo; (James 5:16). Our prayer partners and pastoral ministry are standing in agreement with you!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setRequest('')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold hover:bg-accent"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 font-bold">
                <HandHeart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground">Submit Prayer Request</h1>
                <p className="text-[11px] text-muted-foreground">
                  Share your burden or need with our dedicated pastoral intercessory team.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank to submit anonymously"
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
                <label className="font-semibold text-foreground">Prayer Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold text-rose-500"
                >
                  <option value="Healing & Health">Healing &amp; Health</option>
                  <option value="Family & Marriage">Family &amp; Marriage</option>
                  <option value="Financial Breakthrough">Financial Breakthrough</option>
                  <option value="Spiritual Growth">Spiritual Growth &amp; Deliverance</option>
                  <option value="Career & Business">Career &amp; Business Direction</option>
                  <option value="Salvation of Loved Ones">Salvation of Loved Ones</option>
                  <option value="Thanksgiving">Thanksgiving &amp; Praise</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Prayer Request Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your prayer need in detail..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5">
                <input
                  type="checkbox"
                  id="privateCheck"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="privateCheck" className="cursor-pointer text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Keep strictly confidential for Senior Pastor only
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !request.trim()}
                className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Prayer Need
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
