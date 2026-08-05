'use client'

import { useState, useEffect } from 'react'
import {
  Radio,
  Play,
  Users,
  Sparkles,
  Loader2,
  Clock,
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
        streamUrl: streamUrl.trim() || null,
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
      // Optimistically add to sessions
      setPastSessions((prev) => [
        { id: ref.id, ...sessionData, startedAt: new Date(), createdAt: new Date() },
        ...prev,
      ])
      toast.success('Live Service broadcast triggered! WhatsApp & email alerts dispatched to congregation.')
    } catch {
      toast.error('Failed to start broadcast. Please try again.')
    } finally {
      setBroadcasting(false)
    }
  }

  const handleEndBroadcast = async () => {
    if (!church?.id || !currentSessionId) {
      setIsLive(false)
      return
    }
    try {
      await updateDoc(
        doc(db, 'churches', church.id, 'liveServices', currentSessionId),
        {
          status: 'ended',
          endedAt: serverTimestamp(),
        }
      )
      setIsLive(false)
      setCurrentSessionId(null)
      // Refresh sessions
      loadSessions()
      toast.info('Live Service ended. Session archived to history.')
    } catch {
      toast.error('Failed to end session. Please try again.')
    }
  }

  const handleUpdateStreamUrl = async () => {
    if (!church?.id || !currentSessionId) {
      toast.info('Start a broadcast first to update the stream URL.')
      return
    }
    try {
      await updateDoc(
        doc(db, 'churches', church.id, 'liveServices', currentSessionId),
        { streamUrl: streamUrl.trim() }
      )
      toast.success('Stream URL updated!')
    } catch {
      toast.error('Failed to update stream URL.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Live Service Control Room
            </h1>
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                LIVE NOW
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated live stream broadcasting and real-time congregation engagement for {church?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isLive ? (
            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={broadcasting}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-xs disabled:opacity-50"
            >
              {broadcasting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Radio className="h-4 w-4 animate-pulse" />
              )}
              {broadcasting ? 'Starting Broadcast...' : 'Start Live Broadcast'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEndBroadcast}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-colors"
            >
              End Broadcast Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stream Player Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl border border-border bg-black/90 flex flex-col items-center justify-center text-center p-6 shadow-xs overflow-hidden">
            {isLive ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-500 animate-ping">
                  <Radio className="h-8 w-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Service Is Live</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Broadcast active. Automated WhatsApp &amp; email notifications sent to congregation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                  <Play className="h-7 w-7" />
                </div>
                <h3 className="font-display text-base font-bold text-white">Stream Studio Offline</h3>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Enter your YouTube, Facebook, or HLS stream URL below and click Start Live Broadcast.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2">
            <label className="text-xs font-semibold">Live Stream Source URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://youtube.com/live/..."
                className="flex h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleUpdateStreamUrl}
                className="h-9 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500"
              >
                Update Source
              </button>
            </div>
          </div>
        </div>

        {/* Live Engagement Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-500" />
              Live Engagement Analytics
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-xs">
                <span className="text-muted-foreground">Broadcast Status</span>
                <span className={`font-bold capitalize ${isLive ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {isLive ? 'Streaming Live' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-xs">
                <span className="text-muted-foreground">Total Past Sessions</span>
                <span className="font-bold text-foreground">{pastSessions.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-xs">
                <span className="text-muted-foreground">Auto-Notifications</span>
                <span className="font-bold text-emerald-500">Configured</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Live Assistant
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When live, AI automatically logs attendance, sends welcome notes to online guests, and extracts key sermon quotes for social media.
            </p>
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold text-foreground">Past Broadcast Sessions</h2>
        </div>
        {loadingSessions ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
        ) : pastSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No past sessions recorded. Start your first live broadcast above.
          </div>
        ) : (
          <div className="divide-y divide-border text-xs">
            {pastSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 hover:bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground">
                    Session —{' '}
                    {s.createdAt?.toDate
                      ? s.createdAt.toDate().toLocaleDateString()
                      : s.createdAt instanceof Date
                      ? s.createdAt.toLocaleDateString()
                      : 'Recently'}
                  </p>
                  {s.streamUrl && (
                    <p className="text-[10px] text-muted-foreground truncate max-w-xs mt-0.5">{s.streamUrl}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                    s.status === 'live'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {s.status ?? 'ended'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
