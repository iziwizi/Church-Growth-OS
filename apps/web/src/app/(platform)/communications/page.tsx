'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'

export default function CommunicationsPage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp')
  const [recipientTag, setRecipientTag] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!church?.id) return
    loadHistory()
  }, [church?.id])

  async function loadHistory() {
    if (!church?.id) return
    setLoadingHistory(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'communications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setHistory(list)
    } catch (err) {
      console.error('Error loading communication history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !church?.id) return
    setSending(true)
    try {
      // Persist broadcast record to Firestore
      const broadcastData = {
        channel,
        recipientTag,
        subject: subject.trim() || null,
        message: message.trim(),
        status: 'sent',
        sentBy: user?.uid ?? null,
        sentByEmail: user?.email ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(
        collection(db, 'churches', church.id, 'communications'),
        broadcastData
      )
      // Optimistically add to history
      setHistory((prev) => [{ id: ref.id, ...broadcastData, createdAt: new Date() }, ...prev])
      toast.success(`Broadcast queued via ${channel.toUpperCase()} to "${recipientTag}" recipients.`)
      setSubject('')
      setMessage('')
    } catch {
      toast.error('Failed to send broadcast. Check your provider configuration in Settings.')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteHistory = async (id: string) => {
    if (!church?.id) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'communications', id))
      setHistory((prev) => prev.filter((h) => h.id !== id))
      toast.success('Record removed.')
    } catch {
      toast.error('Failed to remove record.')
    }
  }

  const channelColor = {
    whatsapp: 'bg-emerald-500 text-white',
    email: 'bg-brand-600 text-white',
    sms: 'bg-purple-600 text-white',
  }

  const channelBadge = {
    whatsapp: 'bg-emerald-500/10 text-emerald-500',
    email: 'bg-brand-500/10 text-brand-500',
    sms: 'bg-purple-500/10 text-purple-500',
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
              {(['whatsapp', 'email', 'sms'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all capitalize ${
                    channel === ch ? channelColor[ch] : 'border hover:bg-accent'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold">Recipient Group</label>
              <select
                value={recipientTag}
                onChange={(e) => setRecipientTag(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Congregation Members</option>
                <option value="first_time_visitors">First-Time Visitors Only</option>
                <option value="workers">Church Workers &amp; Leaders</option>
                <option value="tithers">Partners &amp; Donors</option>
                <option value="members">Members Only</option>
                <option value="visitors">All Visitors</option>
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
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 text-xs"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* Provider Status Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <h2 className="font-display text-sm font-bold text-foreground">Delivery Pipeline</h2>
            <div className="space-y-2 text-xs">
              {[
                { name: 'WhatsApp Meta Cloud', key: 'whatsapp', icon: '📱' },
                { name: 'Resend Email Engine', key: 'email', icon: '📧' },
                { name: 'Termii SMS Gateway', key: 'sms', icon: '💬' },
              ].map((provider) => (
                <div
                  key={provider.key}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/20"
                >
                  <span>{provider.icon} {provider.name}</span>
                  <span className="font-bold text-[10px] text-emerald-500">
                    Platform Active
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Communication infrastructure is managed by your platform provider. No configuration required.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
            <h2 className="font-display text-sm font-bold text-foreground">Broadcast Summary</h2>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Broadcasts</span>
                <span className="font-semibold text-foreground">{history.length}</span>
              </div>
              <div className="flex justify-between">
                <span>WhatsApp</span>
                <span className="font-semibold text-foreground">{history.filter(h => h.channel === 'whatsapp').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-semibold text-foreground">{history.filter(h => h.channel === 'email').length}</span>
              </div>
              <div className="flex justify-between">
                <span>SMS</span>
                <span className="font-semibold text-foreground">{history.filter(h => h.channel === 'sms').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Broadcasts
          </h2>
        </div>
        {loadingHistory ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No broadcasts sent yet. Compose and dispatch your first message above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Recipients</th>
                  <th className="p-3.5">Message Preview</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/20">
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          channelBadge[h.channel as keyof typeof channelBadge] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {h.channel}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground capitalize">
                      {h.recipientTag?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 text-foreground max-w-xs truncate">
                      {h.subject ? <span className="font-semibold">{h.subject}: </span> : null}
                      {h.message}
                    </td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        {h.status ?? 'sent'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(h.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
