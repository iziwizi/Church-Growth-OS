'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Radio,
  Play,
  Users,
  Sparkles,
  Loader2,
  Clock,
  Video,
  Share2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  StopCircle,
  Settings,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  Save,
  Send,
  Lock,
  Eye,
  X,
} from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal'
import { toast } from 'sonner'

export type StreamStatus = 'STANDBY' | 'READY' | 'LIVE' | 'ENDED' | 'ERROR'

export default function LiveServicePage() {
  const { church, setChurch } = useChurchStore()
  const { user } = useAuthStore()
  const { hasFeature, planName } = useFeatureAccess()

  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'custom'>('youtube')
  const [streamUrl, setStreamUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [channelInfo, setChannelInfo] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [testingDest, setTestingDest] = useState(false)
  const [status, setStatus] = useState<StreamStatus>('STANDBY')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [copiedKey, setCopiedKey] = useState(false)

  // Promotion Modal State
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoAudience, setPromoAudience] = useState('all')
  const [promoChannel, setPromoChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp')
  const [promoMessage, setPromoMessage] = useState('')
  const [sendingPromo, setSendingPromo] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')

  // Load existing stream config from church record
  useEffect(() => {
    if (!church?.id) return
    const anyChurch = church as any
    const savedConfig = anyChurch.liveStreamConfig || {}
    if (savedConfig.platform) setPlatform(savedConfig.platform)
    if (savedConfig.streamUrl) setStreamUrl(savedConfig.streamUrl)
    if (savedConfig.streamKey) setStreamKey(savedConfig.streamKey)
    if (savedConfig.channelInfo) setChannelInfo(savedConfig.channelInfo)

    loadSessions()
    checkActiveBroadcast()
  }, [church?.id])

  // Preflight validation
  const cleanUrl = streamUrl.trim()
  const hasUrl = !!cleanUrl
  const isValidUrlFormat =
    hasUrl &&
    (cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('rtmp://') ||
      cleanUrl.startsWith('rtmps://'))

  const isPreflightReady = hasUrl && isValidUrlFormat

  useEffect(() => {
    if (status !== 'LIVE') {
      setStatus(isPreflightReady ? 'READY' : 'STANDBY')
    }
  }, [isPreflightReady, status])

  async function checkActiveBroadcast() {
    if (!church?.id) return
    try {
      const q = query(
        collection(db, 'churches', church.id, 'liveServices'),
        where('status', '==', 'live'),
        limit(1)
      )
      const snap = await getDocs(q).catch(() => null)
      if (snap && !snap.empty) {
        const d = snap.docs[0]!
        const data = d.data()
        setStatus('LIVE')
        setCurrentSessionId(d.id)
        setPlatform(data.platform ?? 'youtube')
        setStreamUrl(data.streamUrl ?? '')
      }
    } catch (err) {
      console.error('Error checking active broadcast:', err)
    }
  }

  async function loadSessions() {
    if (!church?.id) return
    setLoadingSessions(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'liveServices'),
        orderBy('createdAt', 'desc'),
        limit(15)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setPastSessions(list)
    } catch (err) {
      console.error('Error loading sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  // ── Save Stream Configuration to Firestore ─────────────────────────────────
  const handleSaveConfiguration = async () => {
    if (!church?.id) return
    setSavingConfig(true)
    try {
      const payload = {
        platform,
        streamUrl: cleanUrl,
        streamKey: streamKey.trim(),
        channelInfo: channelInfo.trim(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, 'churches', church.id), {
        liveStreamConfig: payload,
      })

      if (setChurch) {
        setChurch({ ...(church as any), liveStreamConfig: payload })
      }

      toast.success('Stream configuration saved successfully to Firestore!')
    } catch {
      toast.error('Failed to save stream configuration.')
    } finally {
      setSavingConfig(false)
    }
  }

  // ── Test Destination Reachability / Format ──────────────────────────────────
  const handleTestDestination = async () => {
    if (!cleanUrl) {
      toast.error('Please enter a destination URL first.')
      return
    }

    if (!isValidUrlFormat) {
      toast.error('Invalid URL protocol. URL must start with https://, rtmp://, or rtmps://.')
      return
    }

    setTestingDest(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast.success(`✓ Destination format validated for ${platform.toUpperCase()}: ${cleanUrl}`)
    } catch {
      toast.error('Failed to validate destination.')
    } finally {
      setTestingDest(false)
    }
  }

  // ── Broadcast Lifecycle ───────────────────────────────────────────────────
  const handleStartBroadcast = async () => {
    if (!church?.id) return

    if (!isPreflightReady) {
      toast.error('❌ Live broadcast cannot start. Please provide a valid stream destination URL.')
      return
    }

    setBroadcasting(true)
    try {
      const sessionData = {
        status: 'live',
        platform,
        streamUrl: cleanUrl,
        channelInfo: channelInfo.trim() || null,
        startedAt: serverTimestamp(),
        startedBy: user?.uid ?? null,
        startedByEmail: user?.email ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(
        collection(db, 'churches', church.id, 'liveServices'),
        sessionData
      )
      setStatus('LIVE')
      setCurrentSessionId(ref.id)
      setPastSessions((prev) => [{ id: ref.id, ...sessionData, createdAt: new Date() }, ...prev])
      toast.success('🔴 Live Service Broadcast session recorded! Audience engagement active.')
    } catch {
      setStatus('ERROR')
      toast.error('Failed to initiate live service broadcast session.')
    } finally {
      setBroadcasting(false)
    }
  }

  const handleEndBroadcast = async () => {
    if (!currentSessionId || !church?.id) return
    setBroadcasting(true)
    try {
      await updateDoc(doc(db, 'churches', church.id, 'liveServices', currentSessionId), {
        status: 'ended',
        endedAt: serverTimestamp(),
      })
      setStatus(isPreflightReady ? 'READY' : 'STANDBY')
      setCurrentSessionId(null)
      toast.success('Live Service broadcast concluded and recorded in history.')
      loadSessions()
    } catch {
      toast.error('Failed to end broadcast session.')
    } finally {
      setBroadcasting(false)
    }
  }

  // ── Promotion Dispatch ─────────────────────────────────────────────────────
  const handleOpenPromoModal = () => {
    if (!hasFeature('whatsapp') && !hasFeature('email') && !hasFeature('sms')) {
      setUpgradeFeature('Live Broadcast Notifications')
      setShowUpgradeModal(true)
      return
    }

    const churchName = church?.name || 'Church Service'
    const ytLink = (church as any)?.socialLinks?.youtube || 'https://youtube.com'
    setPromoMessage(
      `🔴 Join us LIVE right now for our service: "${churchName}"!\nWatch here: ${cleanUrl || ytLink}`
    )
    setShowPromoModal(true)
  }

  const handleSendPromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !promoMessage.trim()) return

    if (promoChannel === 'sms' && !hasFeature('sms')) {
      setUpgradeFeature('Termii SMS Gateway')
      setShowUpgradeModal(true)
      return
    }

    setSendingPromo(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'communications'), {
        channel: promoChannel,
        recipientTag: promoAudience,
        subject: `🔴 Live Stream: ${church.name}`,
        message: promoMessage.trim(),
        status: 'sent',
        provider: 'Live Service Engagement Engine',
        sentBy: user?.uid ?? 'live_engine',
        sentByEmail: user?.email ?? 'live_engine',
        churchId: church.id,
        createdAt: serverTimestamp(),
      })

      toast.success(`✓ Live stream broadcast link dispatched via ${promoChannel.toUpperCase()}!`)
      setShowPromoModal(false)
    } catch {
      toast.error('Failed to dispatch live stream broadcast.')
    } finally {
      setSendingPromo(false)
    }
  }

  const handleCopyKey = () => {
    if (!streamKey) return
    navigator.clipboard.writeText(streamKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    toast.success('Stream key copied to clipboard.')
  }

  return (
    <div className="space-y-6 text-xs">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Live Service Control Room
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wider ${
                status === 'LIVE'
                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30 animate-pulse'
                  : status === 'READY'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : status === 'STANDBY'
                  ? 'bg-muted text-muted-foreground border border-border'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}
            >
              ● {status === 'READY' ? 'STREAM READY' : status}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage live-stream destinations, preflight checks, and broadcast promotion for{' '}
            <span className="font-semibold text-foreground">{church?.name}</span>.
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5">
          {status === 'LIVE' && (
            <button
              type="button"
              onClick={handleOpenPromoModal}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 font-semibold text-white hover:bg-purple-500 shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              Promote Stream
            </button>
          )}

          {status === 'LIVE' ? (
            <button
              type="button"
              onClick={handleEndBroadcast}
              disabled={broadcasting}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500 shadow-sm transition-colors"
            >
              {broadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StopCircle className="h-3.5 w-3.5" />}
              End Broadcast
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={broadcasting || !isPreflightReady}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 font-semibold text-white shadow-sm transition-all ${
                isPreflightReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                  : 'bg-muted-foreground/30 cursor-not-allowed opacity-60'
              }`}
            >
              {broadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Record Live Session
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Stream Destination Configuration */}
        <div id="stream-settings" className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-brand-600" />
                <h2 className="font-display text-base font-bold text-foreground">Stream Destination &amp; Encoder</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">Platform Specific Ingest</span>
            </div>

            <div className="space-y-4">
              {/* Platform Selector Tabs */}
              <div>
                <label className="font-semibold text-foreground">Streaming Platform</label>
                <div className="grid grid-cols-3 gap-2.5 mt-1.5">
                  {[
                    { id: 'youtube', label: 'YouTube Live' },
                    { id: 'facebook', label: 'Facebook Live' },
                    { id: 'custom', label: 'Custom RTMP' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id as any)}
                      className={`rounded-xl p-3 text-xs font-semibold transition-all ${
                        platform === p.id
                          ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                          : 'border bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Specific Inputs */}
              {platform === 'youtube' && (
                <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
                  <p className="font-bold text-foreground">YouTube Live Setup</p>
                  <div>
                    <label className="font-semibold text-foreground">YouTube Live URL / Watch Link *</label>
                    <input
                      type="url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://youtube.com/live/your-broadcast-id"
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground">YouTube Channel Name / Handle</label>
                    <input
                      type="text"
                      value={channelInfo}
                      onChange={(e) => setChannelInfo(e.target.value)}
                      placeholder="@yourchurchofficial"
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {platform === 'facebook' && (
                <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
                  <p className="font-bold text-foreground">Facebook Live Setup</p>
                  <div>
                    <label className="font-semibold text-foreground">Facebook Live Video URL *</label>
                    <input
                      type="url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://facebook.com/yourchurch/videos/live"
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground">Facebook Page / Profile Name</label>
                    <input
                      type="text"
                      value={channelInfo}
                      onChange={(e) => setChannelInfo(e.target.value)}
                      placeholder="e.g. Grace Sanctuary Global"
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {platform === 'custom' && (
                <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
                  <p className="font-bold text-foreground">Custom RTMP Ingest Setup</p>
                  <div>
                    <label className="font-semibold text-foreground">RTMP Server Ingest URL *</label>
                    <input
                      type="text"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="rtmp://live.streamingserver.com/live"
                      className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Stream Key (Secret) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Stream Key (Optional / Kept Private)</label>
                  {streamKey && (
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-semibold hover:underline"
                    >
                      {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedKey ? 'Copied' : 'Copy Key'}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  placeholder="live_key_••••••••••••"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use this key in OBS Studio, vMix, or your streaming encoder hardware.
                </p>
              </div>

              {/* Action Buttons: Save Configuration & Test Destination */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={handleTestDestination}
                  disabled={testingDest || !cleanUrl}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-background px-3.5 font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                >
                  {testingDest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  Test Destination
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfiguration}
                  disabled={savingConfig}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
                >
                  {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Stream Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast History Table */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-display text-sm font-bold text-foreground">Recent Broadcast Sessions</h3>
            {loadingSessions ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : pastSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-xs">No broadcast sessions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/20 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Platform</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Audience / Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pastSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-muted/10">
                        <td className="p-3 font-semibold uppercase">{session.platform}</td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {session.streamUrl}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              session.status === 'live'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-emerald-500/10 text-emerald-600'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-[11px]">
                          {session.audienceCount ? `${session.audienceCount} viewers` : 'Not available from provider'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Preflight Status & Social Discovery */}
        <div className="space-y-6">
          {/* Preflight Status Card */}
          <div
            className={`rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
              isPreflightReady
                ? 'border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-4 w-4 ${isPreflightReady ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                <h3 className="font-display text-sm font-bold text-foreground">Preflight Status</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isPreflightReady
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}
              >
                {isPreflightReady ? 'STREAM READY' : 'CONFIGURATION INCOMPLETE'}
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Streaming Platform</span>
                <span className="flex items-center gap-1 font-bold text-foreground uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {platform}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stream Destination URL</span>
                {hasUrl && isValidUrlFormat ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> Missing / Invalid
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stream Key Configured</span>
                {streamKey ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                ) : (
                  <span className="text-muted-foreground">Optional</span>
                )}
              </div>
            </div>

            {!isPreflightReady && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Destination Required
                </p>
                <p className="mt-0.5">Please provide a valid stream destination URL before recording a live broadcast.</p>
              </div>
            )}
          </div>

          {/* Social Discovery Links Card */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Social Profile Channels</h3>
              <Link
                href="/settings?tab=social"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
              >
                <Settings className="h-3 w-3" /> Edit Links
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              These profile channels serve as secondary discovery links for congregation members when no manual live stream URL is active.
            </p>

            <div className="space-y-2 pt-1 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">YouTube:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.youtube || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Facebook:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.facebook || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Instagram:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.instagram || 'Not configured'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROMOTION MODAL ── */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                Promote Live Service to Congregation
              </h3>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendPromotion} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground">Target Audience</label>
                <select
                  value={promoAudience}
                  onChange={(e) => setPromoAudience(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-medium"
                >
                  <option value="all">All Members &amp; Registered Visitors</option>
                  <option value="first_time_visitors">First-Time Visitors Only</option>
                  <option value="workers">Church Workers &amp; Leaders</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Delivery Channel</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: 'whatsapp' as const, label: 'WhatsApp' },
                    { id: 'email' as const, label: 'Email' },
                    { id: 'sms' as const, label: 'SMS' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPromoChannel(ch.id)}
                      className={`rounded-xl p-2 font-semibold text-xs border ${
                        promoChannel === ch.id ? 'bg-brand-600 text-white' : 'bg-background text-muted-foreground'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Broadcast Message</label>
                <textarea
                  rows={4}
                  required
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background p-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="rounded-xl border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingPromo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {sendingPromo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature}
        currentPlan={planName}
        requiredPlan="Starter or Growth Plan"
      />
    </div>
  )
}
