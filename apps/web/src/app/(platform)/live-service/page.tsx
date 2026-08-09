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
import { toast } from 'sonner'

export type StreamStatus = 'STANDBY' | 'READY' | 'LIVE' | 'ENDED' | 'ERROR'

export default function LiveServicePage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()

  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'custom'>('youtube')
  const [streamUrl, setStreamUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [status, setStatus] = useState<StreamStatus>('STANDBY')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    if (!church?.id) return
    loadSessions()
    checkActiveBroadcast()
  }, [church?.id])

  // Compute preflight checklist items
  const cleanUrl = streamUrl.trim()
  const hasValidPlatform = !!platform
  const hasUrl = !!cleanUrl
  const isValidUrlFormat =
    hasUrl &&
    (cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('rtmp://') ||
      cleanUrl.startsWith('rtmps://'))
  const hasKey = !!streamKey.trim()

  const isPreflightReady = hasValidPlatform && hasUrl && isValidUrlFormat

  // Dynamically update status to READY if valid URL configured and not live
  useEffect(() => {
    if (status !== 'LIVE') {
      if (isPreflightReady) {
        setStatus('READY')
      } else {
        setStatus('STANDBY')
      }
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
        limit(10)
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

  const handleStartBroadcast = async () => {
    if (!church?.id) return

    if (!isPreflightReady) {
      toast.error('❌ Live service cannot start. Please complete the streaming configuration.')
      return
    }

    setBroadcasting(true)
    try {
      const sessionData = {
        status: 'live',
        platform,
        streamUrl: cleanUrl,
        streamKeyConfigured: hasKey,
        startedAt: serverTimestamp(),
        startedBy: user?.uid ?? null,
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
      toast.success('🔴 Live Service Broadcast started! Audience engagement active.')
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
      toast.success('Live Service broadcast concluded.')
      loadSessions()
    } catch {
      toast.error('Failed to end broadcast session.')
    } finally {
      setBroadcasting(false)
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
            Manage live-stream destinations, preflight checks, and service engagement for{' '}
            <span className="font-semibold text-foreground">{church?.name}</span>.
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="#stream-settings"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3.5 font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            Configure Stream
          </a>

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
              Go Live Now
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
                <h2 className="font-display text-base font-bold text-foreground">Stream Destination</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">Encoder / RTMP Target</span>
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

              {/* Stream URL / Destination */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">
                    Stream URL / Destination <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isValidUrlFormat && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Valid URL format
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder={
                    platform === 'youtube'
                      ? 'https://youtube.com/live/your-live-id'
                      : platform === 'facebook'
                      ? 'https://facebook.com/yourchurch/live'
                      : 'rtmp://live.streamingserver.com/app'
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border bg-background px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  ⚠️ Enter your live broadcast stream destination URL. Social profile channels are configured in Settings.
                </p>
              </div>

              {/* Stream Key */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Stream Key (Optional / Private)</label>
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
                  className="mt-1.5 flex h-10 w-full rounded-xl border bg-background px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Keep your stream key private. Use this key in OBS Studio, vMix, or your hardware encoder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preflight Status & Social Promotion */}
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
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Selected
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stream URL Configured</span>
                {hasUrl ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> Missing
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Destination Format</span>
                {isValidUrlFormat ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid https/rtmp
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> Invalid
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stream Key Provided</span>
                {hasKey ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Optional
                  </span>
                )}
              </div>
            </div>

            {!isPreflightReady && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Action Required
                </p>
                <p className="mt-0.5">Please provide a valid stream destination URL before starting the broadcast.</p>
              </div>
            )}
          </div>

          {/* Social Promotion Links Card (Separated from encoder stream) */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Social Promotion Links</h3>
              <Link
                href="/settings?tab=social"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
              >
                <Settings className="h-3 w-3" /> Edit Links
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              These profile channels will be automatically included in broadcast invitations sent to members and visitors.
            </p>

            <div className="space-y-2 pt-1 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">YouTube Channel:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.youtube || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Facebook Page:</span>
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
    </div>
  )
}
