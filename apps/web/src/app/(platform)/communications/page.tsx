'use client'

import { useState } from 'react'
import { MessageSquare, Send, Mail, Phone, CheckCircle2, Loader2, Sparkles, Filter } from 'lucide-react'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function CommunicationsPage() {
  const { church } = useChurchStore()
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp')
  const [recipientTag, setRecipientTag] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setTimeout(() => {
      setSending(false)
      toast.success(`Broadcast message sent via ${channel.toUpperCase()} to ${recipientTag} list!`)
      setSubject('')
      setMessage('')
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Unified Communications Center
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Send WhatsApp messages, emails, and SMS broadcasts to members of {church?.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Broadcast Form */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-sm font-bold text-foreground">Compose Broadcast</h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                  channel === 'whatsapp' ? 'bg-emerald-500 text-white' : 'border hover:bg-accent'
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                  channel === 'email' ? 'bg-brand-600 text-white' : 'border hover:bg-accent'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                  channel === 'sms' ? 'bg-purple-600 text-white' : 'border hover:bg-accent'
                }`}
              >
                SMS
              </button>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold">Recipient Group</label>
              <select
                value={recipientTag}
                onChange={(e) => setRecipientTag(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
              >
                <option value="all">All Congregation Members</option>
                <option value="first_time_visitors">First-Time Visitors Only</option>
                <option value="workers">Church Workers & Leaders</option>
                <option value="tithers">Partners & Donors</option>
              </select>
            </div>

            {channel === 'email' && (
              <div>
                <label className="font-semibold">Email Subject Line *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Special Invitation to Sunday Service"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
            )}

            <div>
              <label className="font-semibold">Message Body *</label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type broadcast message..."
                className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* Infrastructure Status */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <h2 className="font-display text-sm font-bold text-foreground">Delivery Pipeline</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20">
                <span>WhatsApp Meta Cloud</span>
                <span className="font-bold text-emerald-500">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20">
                <span>Resend Email Engine</span>
                <span className="font-bold text-emerald-500">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20">
                <span>Termii SMS Gateway</span>
                <span className="font-bold text-emerald-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
