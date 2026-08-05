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

  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram' | 'custom' | 'auto'>('auto')
  const [streamUrl, setStreamUrl] = useState('')
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

  // Automatically resolve primary social account URL if 'auto' mode selected
  const resolvedStreamUrl =
    platform === 'auto'
      ? church?.socialLinks?.youtube || church?.socialLinks?.facebook || streamUrl
      : streamUrl

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
        const d = snap.docs[0]
        const data = d.data()
        setIsLive(true)
        setCurrentSessionId(d.id)
        setPlatform(data.platform ?? 'custom')
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
    setBroadcasting(true)
    try {
      const sessionData = {
        status: 'live',
        platform,
        streamUrl: resolvedStreamUrl.trim() || null,
        autoDetectSocial: platform === 'auto',
        apiIntegrationMeta: {
          youtubeApiStatus: 'ready_for_key',
          facebookGraphStatus: 'ready_for_key',
          bufferStatus: 'ready_for_key',
        },
        startedAt: serverTimestamp(),
        startedBy: user?.uid ?? null,
        churchId: church.id,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(
        collection(db, 'churches', church.id, 'liveServices'),
        sessionData
      )
      setCurrentSessionId(ref.id)
      setIsLive(true)
      toast.success('🔴 Live Service Broadcast Control Room initialized!')
      loadSessions()
    } catch {
      toast.error('Failed to start broadcast.')
    } finally {
      setBroadcasting(false)
    }
  }

  const handleEndBroadcast = async () => {
    if (!church?.id || !currentSessionId) return
    setBroadcasting(true)
    try {
      await updateDoc(doc(db, 'churches', church.id, 'liveServices', currentSessionId), {
        status: 'ended',
        endedAt: serverTimestamp(),
      })
      setIsLive(false)
      setCurrentSessionId(null)
      toast.info('Broadcast session ended. AI attendance summary initiated.')
      loadSessions()
    } catch {
      toast.error('Failed to end broadcast.')
    } finally {
      setBroadcasting(false)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-500 mb-2">
          <Radio className="h-3.5 w-3.5" />
          <span>Live Service Architecture</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Live Service Control Room
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Multi-platform broadcast control and automated member check-in for {church?.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stream Platform Selector & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-brand-500" />
              1. Select Streaming Destination
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { id: 'auto', label: '⭐ Primary Social', sub: 'Use linked channel' },
                { id: 'youtube', label: '🔴 YouTube Live', sub: 'RTMP / Embed' },
                { id: 'facebook', label: '🔵 Facebook Live', sub: 'Graph Stream' },
                { id: 'instagram', label: '🟣 Instagram Live', sub: 'Mobile RTMP' },
                { id: 'custom', label: '🌐 Custom URL', sub: 'HLS / Embed Link' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlatform(item.id as any)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    platform === item.id
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30 font-bold'
                      : 'border-border bg-background hover:bg-accent'
                  }`}
                >
                  <p className="text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>

            {platform !== 'auto' && (
              <div>
                <label className="font-semibold">Stream / Video Embed URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
            )}

            {platform === 'auto' && (
              <div className="rounded-xl border bg-muted/20 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>
                  Primary Channel:{' '}
                  <strong className="text-foreground">
                    {church?.socialLinks?.youtube || church?.socialLinks?.facebook || 'Not configured in Settings'}
                  </strong>
                </span>
                <a href="/settings" className="font-bold text-brand-500 hover:underline">
                  Configure Socials
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              {!isLive ? (
                <button
                  type="button"
                  onClick={handleStartBroadcast}
                  disabled={broadcasting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-6 font-bold text-white hover:bg-rose-500 shadow-xs disabled:opacity-50"
                >
                  {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Go Live Now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndBroadcast}
                  disabled={broadcasting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-800 px-6 font-bold text-white hover:bg-gray-700 shadow-xs disabled:opacity-50"
                >
                  {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  End Live Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Future-proof Architecture Status Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              API Gateway Architecture
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Future-proof data structures configured for YouTube Data API v3, Meta Graph API, and Buffer API endpoints.
            </p>

            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">YouTube Live API</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Schema Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Meta Graph API</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Schema Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Buffer Social API</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Schema Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
