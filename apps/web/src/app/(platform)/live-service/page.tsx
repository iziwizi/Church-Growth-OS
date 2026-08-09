'use client'

import { useState, useEffect } from 'react'
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

export default function LiveServicePage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()

  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'custom'>('youtube')
  const [streamUrl, setStreamUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    if (!church?.id) return
    loadSessions()
    checkActiveBroadcast()
  }, [church?.id])

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
        setIsLive(true)
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

    // ── PREFLIGHT VALIDATION: Block fake live stream if URL is missing ──
    const cleanUrl = streamUrl.trim()
    if (!cleanUrl) {
      toast.error('❌ Live Stream Destination URL is required before going live. Please enter your YouTube Live, Facebook Live, or RTMP destination.')
      return
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('rtmp://')) {
      toast.error('❌ Invalid URL format. Stream destination must begin with https:// or rtmp://')
      return
    }

    setBroadcasting(true)
    try {
      const sessionData = {
        status: 'live',
        platform,
        streamUrl: cleanUrl,
        streamKey: streamKey.trim() ? '••••••••' : null,
        startedAt: serverTimestamp(),
        startedBy: user?.uid ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(
        collection(db, 'churches', church.id, 'liveServices'),
        sessionData
      )
      setIsLive(true)
      setCurrentSessionId(ref.id)
      setPastSessions((prev) => [{ id: ref.id, ...sessionData, createdAt: new Date() }, ...prev])
      toast.success('🔴 Live Service Broadcast started! Audience engagement active.')
    } catch {
      toast.error('Failed to initiate live service broadcast.')
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
      setIsLive(false)
      setCurrentSessionId(null)
      toast.success('Live Service broadcast concluded.')
      loadSessions()
    } catch {
      toast.error('Failed to end broadcast.')
    } finally {
      setBroadcasting(false)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Radio className={`h-7 w-7 ${isLive ? 'text-rose-500 animate-pulse' : 'text-brand-600'}`} />
            Live Service Control Room
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage live stream preflight, RTMP destinations, and automated guest engagement for {church?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <button
              type="button"
              onClick={handleEndBroadcast}
              disabled={broadcasting}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500 shadow-sm"
            >
              {broadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StopCircle className="h-3.5 w-3.5" />}
              End Broadcast
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={broadcasting}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-500 shadow-sm disabled:opacity-50"
            >
              {broadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Go Live Now
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stream Destination & Preflight */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-sm font-bold text-foreground">Streaming Destination (Preflight)</h2>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isLive ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'
              }`}
            >
              {isLive ? '● BROADCASTING LIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-semibold text-foreground">Streaming Platform</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { id: 'youtube', label: 'YouTube Live' },
                  { id: 'facebook', label: 'Facebook Live' },
                  { id: 'custom', label: 'Custom RTMP' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id as any)}
                    className={`rounded-xl p-2.5 text-xs font-semibold transition-all ${
                      platform === p.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">
                Stream URL / Destination <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="url"
                required
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder={
                  platform === 'youtube'
                    ? 'https://youtube.com/live/your-stream-id'
                    : platform === 'facebook'
                    ? 'https://facebook.com/yourchurch/live'
                    : 'rtmp://live.streamingserver.com/app'
                }
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ Must be a valid live stream destination URL. Profile links are configured in Settings &gt; Social Links.
              </p>
            </div>

            <div>
              <label className="font-semibold text-foreground">Stream Key (Optional / Private)</label>
              <input
                type="password"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="live_key_..."
                className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Status & Social Links Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
            <h2 className="font-display text-sm font-bold text-foreground">Social Promotion Links</h2>
            <p className="text-[11px] text-muted-foreground">
              These profile channels will be included in automated broadcast messages.
            </p>
            <div className="space-y-2 pt-1 border-t">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>YouTube:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.youtube || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Facebook:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.facebook || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Instagram:</span>
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {church?.socialLinks?.instagram || 'Not configured'}
                </span>
              </div>
            </div>
            <a
              href="/settings?tab=social"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline pt-1"
            >
              <Settings className="h-3 w-3" /> Configure Socials
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
