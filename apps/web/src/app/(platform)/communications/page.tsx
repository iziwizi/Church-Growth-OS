'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  FileText,
  Copy,
  Info,
  ShieldCheck,
  AlertCircle,
  Tag,
  Lock,
} from 'lucide-react'
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
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal'

const TEMPLATE_PRESETS = [
  {
    name: 'First-Time Guest Pastoral Welcome',
    channel: 'whatsapp' as const,
    subject: 'Welcome to {{church_name}} Family!',
    body: 'Dear {{member_name}},\n\nIt was a divine privilege having you worship with us at {{church_name}}! On behalf of {{pastor_name}} and the entire church family, you are warmly celebrated.\n\nWe would love to stand in faith with you. Reply to this message if you have any prayer requests! 🙏',
  },
  {
    name: 'Midweek Fellowship & Prayer Reminder',
    channel: 'whatsapp' as const,
    subject: 'Midweek Fellowship Tonight',
    body: '✨ *{{church_name}} MIDWEEK SERVICE* ✨\n\nBeloved {{member_name}},\n\nJoin us tonight at 6:30 PM for a powerful time of intercession, revelation, and spiritual impartation.\n\n📍 Main Sanctuary & Online.\nCome expectant! 🙏',
  },
  {
    name: 'Sunday Service Special Invitation',
    channel: 'email' as const,
    subject: 'Join Us This Sunday at {{church_name}}',
    body: 'Dear {{member_name}},\n\nGrace and peace be multiplied to you in the name of Jesus Christ.\n\n{{pastor_name}} will be ministering a life-transforming message this Sunday. We invite you and your loved ones to experience dynamic worship and the uncompromised Word of God.\n\nService Times: 8:00 AM & 10:30 AM.\n\nWarm regards,\nThe Ministry Team at {{church_name}}',
  },
  {
    name: 'Ministry Resource & Store Release',
    channel: 'whatsapp' as const,
    subject: 'New Ministry Resource Available',
    body: '📚 *NEW SPIRITUAL RESOURCE — {{church_name}}*\n\nBeloved {{member_name}},\n\nWe are excited to announce our new ministry publication: "{{product_name}}".\n\nEquip yourself for spiritual growth. Visit our Church Store to access your copy today!',
  },
]

export default function CommunicationsPage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'logs'>('compose')
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp')
  const [recipientTag, setRecipientTag] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const { hasFeature, planName } = useFeatureAccess()
  const hasSms = hasFeature('sms')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('')
  const [upgradeFeatureDesc, setUpgradeFeatureDesc] = useState('')

  const handleSelectChannel = (chId: 'whatsapp' | 'email' | 'sms') => {
    if (chId === 'sms' && !hasSms) {
      setUpgradeFeatureName('Termii SMS Broadcast Gateway')
      setUpgradeFeatureDesc(
        'SMS text messaging requires a Starter, Growth, or Enterprise ministry plan with dedicated sender ID routing. Upgrade your plan to send SMS broadcasts.'
      )
      setShowUpgradeModal(true)
      return
    }
    setChannel(chId)
  }

  // WhatsApp Mode & SMS Sender ID
  const whatsappMode = church?.settings?.whatsappMode ?? 'shared'
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
    setChannel(tpl.channel)
    setSubject(tpl.subject)
    setMessage(tpl.body)
    setActiveTab('compose')
    toast.success(`Template "${tpl.name}" applied!`)
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !church?.id) return
    setSending(true)

    try {
      // Format final message by resolving standard placeholders
      const churchName = church.name || 'Church'
      const pastorName = `${church.seniorPastor?.title || 'Pastor'} ${church.seniorPastor?.name || 'Senior Pastor'}`
      
      const broadcastData = {
        channel,
        recipientTag,
        subject: subject.trim() || null,
        message: message.trim(),
        status: 'sent',
        provider: channel === 'whatsapp' ? (whatsappMode === 'waba' ? 'Custom WABA' : 'Platform Shared') : channel === 'email' ? 'Resend' : 'Termii',
        sentBy: user?.uid ?? null,
        sentByEmail: user?.email ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      }

      const ref = await addDoc(
        collection(db, 'churches', church.id, 'communications'),
        broadcastData
      )

      setHistory((prev) => [{ id: ref.id, ...broadcastData, createdAt: new Date() }, ...prev])
      toast.success(`✓ Broadcast dispatched via ${channel.toUpperCase()} to "${recipientTag}" audience.`)
      setSubject('')
      setMessage('')
    } catch {
      toast.error('Failed to send broadcast.')
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
                {[
                  { id: 'whatsapp' as const, label: 'WhatsApp', icon: Smartphone, locked: false },
                  { id: 'email' as const, label: 'Email', icon: Mail, locked: false },
                  { id: 'sms' as const, label: 'SMS', icon: MessageSquare, locked: !hasSms },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChannel(ch.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      channel === ch.id
                        ? ch.id === 'whatsapp'
                          ? 'bg-emerald-600 text-white'
                          : ch.id === 'email'
                          ? 'bg-brand-600 text-white'
                          : 'bg-purple-600 text-white'
                        : ch.locked
                        ? 'border bg-muted/20 text-muted-foreground opacity-75 hover:border-brand-500/40'
                        : 'border hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <ch.icon className="h-3.5 w-3.5" />
                    <span>{ch.label}</span>
                    {ch.locked && <Lock className="h-3 w-3 text-amber-500 ml-0.5" />}
                  </button>
                ))}
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

              {channel === 'email' && (
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
                  disabled={sending}
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
                  {
                    name: 'WhatsApp Meta Cloud',
                    channel: 'whatsapp',
                    mode: whatsappMode === 'waba' ? 'Dedicated WABA' : 'Platform Shared (Mode A)',
                    icon: '📱',
                  },
                  {
                    name: 'Resend Email Engine',
                    channel: 'email',
                    mode: 'Active (platform-verified)',
                    icon: '📧',
                  },
                  {
                    name: 'SMS Carrier Gateway',
                    channel: 'sms',
                    mode: `Sender ID: "${smsSenderId}" (Compliant)`,
                    icon: '💬',
                  },
                ].map((p) => (
                  <div
                    key={p.channel}
                    className="flex flex-col p-2.5 rounded-xl bg-muted/20 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {p.icon} {p.name}
                      </span>
                      <span className="font-bold text-[10px] text-emerald-600">Active</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{p.mode}</span>
                  </div>
                ))}
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
                <div className="flex justify-between">
                  <span>WhatsApp</span>
                  <span className="font-semibold text-foreground">
                    {history.filter((h) => h.channel === 'whatsapp').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-semibold text-foreground">
                    {history.filter((h) => h.channel === 'email').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SMS</span>
                  <span className="font-semibold text-foreground">
                    {history.filter((h) => h.channel === 'sms').length}
                  </span>
                </div>
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
                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-600 uppercase">
                    {tpl.channel}
                  </span>
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
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Audience</th>
                    <th className="p-3.5">Message Snippet</th>
                    <th className="p-3.5">Provider</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="p-3.5 font-bold uppercase text-[10px]">
                        {log.channel}
                      </td>
                      <td className="p-3.5 font-medium">{log.recipientTag}</td>
                      <td className="p-3.5 max-w-xs truncate text-muted-foreground">
                        {log.subject ? `[${log.subject}] ` : ''}
                        {log.message}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-[11px]">{log.provider ?? 'Platform'}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> {log.status}
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
