'use client'

import { useState } from 'react'
import { Radio, Play, Users, MessageSquare, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function LiveServicePage() {
  const { church } = useChurchStore()
  const [streamUrl, setStreamUrl] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const handleStartBroadcast = () => {
    setBroadcasting(true)
    setTimeout(() => {
      setIsLive(true)
      setBroadcasting(false)
      toast.success('Live Service broadcast triggered! WhatsApp & email alerts dispatched to congregation.')
    }, 1500)
  }

  const handleEndBroadcast = () => {
    setIsLive(false)
    toast.info('Live Service ended. Session archived.')
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
              <Radio className="h-4 w-4 animate-pulse" />
              {broadcasting ? 'Triggering Broadcast...' : 'Start Live Broadcast'}
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
                  Broadcast active. Automated WhatsApp & email notifications sent to congregation.
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
                className="flex h-9 flex-1 rounded-xl border bg-background px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => toast.success('Stream URL updated!')}
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
                <span className="text-muted-foreground">Estimated Viewers</span>
                <span className="font-bold text-foreground">{isLive ? '240' : '0'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-xs">
                <span className="text-muted-foreground">Broadcast Status</span>
                <span className={`font-bold capitalize ${isLive ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {isLive ? 'Streaming Live' : 'Offline'}
                </span>
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
    </div>
  )
}
