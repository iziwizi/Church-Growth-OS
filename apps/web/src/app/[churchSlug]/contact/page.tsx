'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Send, CheckCircle2, ArrowLeft, Loader2, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicContactPage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !fullName.trim() || !churchSlug) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchSlug,
          formType: 'contact',
          data: {
            fullName: fullName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            message: message.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to send message.')
      }

      setSubmitted(true)
      toast.success('Your message has been sent to the church pastoral office.')
    } catch (err: any) {
      toast.error(err.message ?? 'Submission error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-lg mx-auto w-full space-y-6 text-xs">
        <Link
          href={`/${churchSlug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Church Portal
        </Link>

        {submitted ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Message Sent!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thank you for contacting us. A member of our pastoral care team will get in touch with you shortly.
            </p>
            <div className="pt-2">
              <Link
                href={`/${churchSlug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Return to Church Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 font-bold">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground">Contact Pastoral Office</h1>
                <p className="text-[11px] text-muted-foreground">
                  Send inquiries about counseling, weddings, child dedication, or membership.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Adebayo"
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
                <label className="font-semibold text-foreground">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can our church family assist you today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim() || !fullName.trim()}
                className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl bg-sky-600 font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Message
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
