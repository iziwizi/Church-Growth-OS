'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicTestimonyPage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !title.trim() || !churchSlug) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchSlug,
          formType: 'testimony',
          data: {
            fullName: fullName.trim() || 'Beloved Member',
            email: email.trim() || null,
            phone: phone.trim() || null,
            title: title.trim(),
            content: content.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to submit praise report.')
      }

      setSubmitted(true)
      toast.success('Your testimony has been sent for pastoral thanksgiving!')
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Testimony Received!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;They overcame him by the blood of the Lamb and by the word of their testimony.&rdquo; (Revelation 12:11). Thank you for declaring the goodness of the Lord!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setTitle('')
                  setContent('')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold hover:bg-accent"
              >
                Submit Another Testimony
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground">Share Praise Report &amp; Testimony</h1>
                <p className="text-[11px] text-muted-foreground">
                  Testify of the breakthroughs, healing, favor, and provisions God has granted you.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Grace"
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
                <label className="font-semibold text-foreground">Testimony Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supernatural healing, New job, Divine protection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Describe What God Did *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tell the story of how God came through for you..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !content.trim() || !title.trim()}
                className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Praise Report
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
