'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Smartphone,
  Mail,
  MessageSquare,
  Copy,
  Lock,
} from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal'

type Channel = 'whatsapp' | 'email' | 'sms'

const TEMPLATE_PRESETS = [
  {
    name: 'First-Time Guest Pastoral Welcome',
    channels: ['whatsapp'] as Channel[],
    subject: 'Welcome to {{church_name}} Family!',
    body: 'Dear {{member_name}},\n\nIt was a divine privilege having you worship with us at {{church_name}}! On behalf of {{pastor_name}} and the entire church family, you are warmly celebrated.\n\nWe would love to stand in faith with you. Reply to this message if you have any prayer requests! 🙏',
  },
  {
    name: 'Midweek Fellowship & Prayer Reminder',
    channels: ['whatsapp'] as Channel[],
    subject: 'Midweek Fellowship Tonight',
    body: '✨ *{{church_name}} MIDWEEK SERVICE* ✨\n\nBeloved {{member_name}},\n\nJoin us tonight at 6:30 PM for a powerful time of intercession, revelation, and spiritual impartation.\n\n📍 Main Sanctuary & Online.\nCome expectant! 🙏',
  },
  {
    name: 'Sunday Service Special Invitation',
    channels: ['email', 'whatsapp'] as Channel[],
    subject: 'Join Us This Sunday at {{church_name}}',
    body: 'Dear {{member_name}},\n\nGrace and peace be multiplied to you in the name of Jesus Christ.\n\n{{pastor_name}} will be ministering a life-transforming message this Sunday. We invite you and your loved ones to experience dynamic worship and the uncompromised Word of God.\n\nService Times: 8:00 AM & 10:30 AM.\n\nWarm regards,\nThe Ministry Team at {{church_name}}',
  },
  {
    name: 'Ministry Resource & Store Release',
    channels: ['whatsapp'] as Channel[],
    subject: 'New Ministry Resource Available',
    body: '📚 *NEW SPIRITUAL RESOURCE — {{church_name}}*\n\nBeloved {{member_name}},\n\nWe are excited to announce our new ministry publication: "{{product_name}}".\n\nEquip yourself for spiritual growth. Visit our Church Store to access your copy today!',
  },
]

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Smartphone; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: Smartphone, color: 'emerald' },
  email: { label: 'Email', icon: Mail, color: 'brand' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'purple' },
}

export default function CommunicationsPage() {
  const { church } = useChurchStore()

  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'logs'>('compose')
  // Multi-select: WhatsApp only / Email only / SMS only / WhatsApp+Email /
  // WhatsApp+Email+SMS — or any other combination the church chooses.
  const [channels, setChannels] = useState<Channel[]>(['whatsapp'])
  const [recipientTag, setRecipientTag] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const { isFeatureAllowed, channelsConfigured, planName } = useFeatureAccess()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('')
  const [upgradeFeatureDesc, setUpgradeFeatureDesc] = useState('')

  const isChannelAvailable = (ch: Channel) => isFeatureAllowed(ch) && channelsConfigured[ch]

  const toggleChannel = (ch: Channel) => {
    if (!isFeatureAllowed(ch)) {
      setUpgradeFeatureName(`${CHANNEL_META[ch].label} Broadcasting`)
      setUpgradeFeatureDesc(
        `${CHANNEL_META[ch].label} messaging requires a plan tier that includes this channel, or has been disabled platform-wide. Upgrade your plan to unlock it.`
      )
      setShowUpgradeModal(true)
      return
    }
    if (!channelsConfigured[ch]) {
      toast.error(`${CHANNEL_META[ch].label} is not configured on the platform yet. Contact support.`)
      return
    }
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))
  }

  const smsSenderId = church?.settings?.smsSenderId ?? 'CHURCH'

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
        limit(30)
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

  const insertVariable = (varTag: string) => {
    setMessage((prev) => `${prev} ${varTag} `)
  }

  const applyTemplate = (tpl: typeof TEMPLATE_PRESETS[0]) => {
    setChannels(tpl.channels.filter((c) => isChannelAvailable(c)))
    setSubject(tpl.subject)
    setMessage(tpl.body)
    setActiveTab('compose')
    toast.success(`Template "${tpl.name}" applied!`)
  }

  async function resolveRecipients(): Promise<Array<{ name?: string; phone?: string; email?: string }>> {
    if (!church?.id) return []
    const peopleSnap = await getDocs(collection(db, 'churches', church.id, 'people')).catch(() => null)
    if (!peopleSnap || peopleSnap.empty) return []
    const recipients: Array<{ name?: string; phone?: string; email?: string }> = []
    peopleSnap.docs.forEach((d) => {
      const p = d.data()
      const tags: string[] = Array.isArray(p.tags) ? p.tags : [p.tag].filter(Boolean)
      const matches =
        recipientTag === 'all' ||
        (recipientTag === 'workers' && tags.includes('worker')) ||
        (recipientTag === 'members' && tags.includes('member')) ||
        (recipientTag === 'visitors' && tags.includes('visitor')) ||
        (recipientTag === 'first_time_visitors' && tags.includes('visitor')) ||
        (recipientTag === 'tithers' && tags.includes('partner'))
      if (matches && (p.phone || p.email)) {
        recipients.push({ name: p.fullName, phone: p.phone, email: p.email })
      }
    })
    return recipients
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !church?.id) return
    if (channels.length === 0) {
      toast.error('Select at least one channel.')
      return
    }
    setSending(true)

    try {
      const recipients = await resolveRecipients()
      if (recipients.length === 0) {
        toast.error('No recipients found with a phone/email for this audience.')
        setSending(false)
        return
      }

      const idToken = await getIdToken()
      const res = await fetch('/api/communications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          churchId: church.id,
          channels,
          recipients,
          subject: subject.trim() || undefined,
          message: message.trim(),
          category: recipientTag,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to send broadcast.')
      }

      const summary = (data.channelResults ?? [])
        .map((r: any) => `${r.channel.toUpperCase()}: ${r.sent}/${r.attempted || r.sent + r.failed} sent${r.skipped ? ` (skipped: ${r.skipped})` : ''}`)
        .join(' · ')

      if (data.status === 'sent') toast.success(`✓ Broadcast delivered. ${summary}`)
      else if (data.status === 'partial') toast.warning(`Broadcast partially delivered. ${summary}`)
      else toast.error(`Broadcast failed to send. ${summary}`)

      setSubject('')
      setMessage('')
      loadHistory()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send broadcast.')
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

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Unified Communications Center
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Multi-channel WhatsApp, Email, and SMS broadcast engine for {church?.name}.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'compose'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Compose Broadcast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Ministry Templates ({TEMPLATE_PRESETS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Delivery Logs ({history.length})
        </button>
      </div>

      {/* ── TAB 1: COMPOSE BROADCAST ── */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Compose Card */}
          <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-sm font-bold text-foreground">Compose Message</h2>
              <div className="flex gap-1.5">
                {(['whatsapp', 'email', 'sms'] as Channel[]).map((chId) => {
                  const meta = CHANNEL_META[chId]
                  const selected = channels.includes(chId)
                  const available = isChannelAvailable(chId)
                  return (
                    <button
                      key={chId}
                      type="button"
                      onClick={() => toggleChannel(chId)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? chId === 'whatsapp'
                            ? 'bg-emerald-600 text-white'
                            : chId === 'email'
                            ? 'bg-brand-600 text-white'
                            : 'bg-purple-600 text-white'
                          : !available
                          ? 'border bg-muted/20 text-muted-foreground opacity-75 hover:border-brand-500/40'
                          : 'border hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      <meta.icon className="h-3.5 w-3.5" />
                      <span>{meta.label}</span>
                      {!available && <Lock className="h-3 w-3 text-amber-500 ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="font-semibold text-foreground">Target Audience</label>
                <select
                  value={recipientTag}
                  onChange={(e) => setRecipientTag(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Registered Members &amp; Contacts</option>
                  <option value="first_time_visitors">First-Time Visitors Only</option>
                  <option value="workers">Church Workers &amp; Leaders</option>
                  <option value="tithers">Partners &amp; Donors</option>
                  <option value="members">Confirmed Members</option>
                  <option value="visitors">All Visitors Archive</option>
                </select>
              </div>

              {channels.includes('email') && (
                <div>
                  <label className="font-semibold text-foreground">Email Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. A Pastoral Message from Pastor David"
                    className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Message Content *</label>
                  <span className="text-[10px] text-muted-foreground">
                    {message.length} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type broadcast message..."
                  className="mt-1 flex w-full rounded-xl border border-input bg-background p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring font-sans text-xs"
                />
              </div>

              {/* Dynamic Variables Pill Bar */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Click to Insert Personalization Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Member Name', tag: '{{member_name}}' },
                    { label: 'Church Name', tag: '{{church_name}}' },
                    { label: 'Pastor Name', tag: '{{pastor_name}}' },
                    { label: 'Event Name', tag: '{{event_name}}' },
                    { label: 'Product Name', tag: '{{product_name}}' },
                    { label: 'Dashboard URL', tag: '{{dashboard_url}}' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="rounded-lg border bg-muted/30 px-2 py-0.5 text-[10px] font-mono text-brand-600 hover:bg-brand-500/10 transition-colors"
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending || channels.length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 text-xs shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Dispatch Broadcast Now
                </button>
              </div>
            </form>
          </div>

          {/* Delivery Configuration Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
              <h2 className="font-display text-sm font-bold text-foreground">Delivery Pipeline Status</h2>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'WhatsApp Meta Cloud', channel: 'whatsapp' as Channel, mode: 'Platform Shared', icon: '📱' },
                  { name: 'Resend Email Engine', channel: 'email' as Channel, mode: 'Platform Verified Domain', icon: '📧' },
                  { name: 'SMS Carrier Gateway', channel: 'sms' as Channel, mode: `Sender ID: "${smsSenderId}"`, icon: '💬' },
                ].map((p) => {
                  const available = isChannelAvailable(p.channel)
                  return (
                    <div
                      key={p.channel}
                      className="flex flex-col p-2.5 rounded-xl bg-muted/20 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {p.icon} {p.name}
                        </span>
                        <span className={`font-bold text-[10px] ${available ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {available ? 'Active' : 'Unavailable'}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {available ? p.mode : !channelsConfigured[p.channel] ? 'Not configured on platform' : 'Not included in your plan'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
              <h2 className="font-display text-sm font-bold text-foreground">Broadcast Summary</h2>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Broadcasts</span>
                  <span className="font-semibold text-foreground">{history.length}</span>
                </div>
                {(['whatsapp', 'email', 'sms'] as Channel[]).map((ch) => (
                  <div key={ch} className="flex justify-between">
                    <span>{CHANNEL_META[ch].label}</span>
                    <span className="font-semibold text-foreground">
                      {history.filter((h) => (h.channels ?? [h.channel]).includes(ch)).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MINISTRY TEMPLATES ── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATE_PRESETS.map((tpl, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">{tpl.name}</span>
                  <div className="flex gap-1">
                    {tpl.channels.map((c) => (
                      <span key={c} className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-600 uppercase">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="font-semibold text-[11px] text-muted-foreground">{tpl.subject}</p>
                <div className="rounded-xl border bg-muted/20 p-3 font-sans text-[11px] whitespace-pre-wrap text-foreground/80 max-h-36 overflow-y-auto">
                  {tpl.body}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: DELIVERY LOGS ── */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No broadcasts sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Channels</th>
                    <th className="p-3.5">Audience</th>
                    <th className="p-3.5">Message Snippet</th>
                    <th className="p-3.5">Recipients</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="p-3.5 font-bold uppercase text-[10px]">
                        {(log.channels ?? [log.channel]).join(' + ')}
                      </td>
                      <td className="p-3.5 font-medium">{log.category ?? log.recipientTag}</td>
                      <td className="p-3.5 max-w-xs truncate text-muted-foreground">
                        {log.subject ? `[${log.subject}] ` : ''}
                        {log.message}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-[11px]">{log.recipientCount ?? '—'}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : log.status === 'partial'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {log.status === 'sent' ? <CheckCircle2 className="h-3 w-3" /> : log.status === 'partial' ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {log.status ?? 'sent'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(log.id)}
                          className="text-muted-foreground hover:text-rose-500 p-1"
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
      )}

      {/* Dynamic Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeatureName}
        featureDescription={upgradeFeatureDesc}
        currentPlan={planName}
        requiredPlan="Starter or Growth Plan"
      />
    </div>
  )
}
