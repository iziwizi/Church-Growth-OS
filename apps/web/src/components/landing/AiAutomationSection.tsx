'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  Eye,
  Sliders,
  MessageSquare,
  Send,
  Mail,
  Smartphone,
  CheckCheck,
  RefreshCw,
  Edit3,
  Share2,
  MousePointer,
} from 'lucide-react'

type DispatchStage = 'drafting' | 'review' | 'editing' | 'approved' | 'routing' | 'whatsapp' | 'email' | 'sms' | 'complete'

export function AiAutomationSection() {
  // Mode order: 1. Autonomous Mode (default), 2. Human Approval Mode
  const [selectedMode, setSelectedMode] = useState<'autonomous' | 'manual'>('autonomous')
  const [dispatchStage, setDispatchStage] = useState<DispatchStage>('drafting')
  const [messageText, setMessageText] = useState(
    'Dear Sister Sarah, thank you for worshipping with Grace City today! Pastor Emmanuel and our team would love to share this week’s study notes with you and invite you to our midweek fellowship.'
  )
  const [cursorTarget, setCursorTarget] = useState<'idle' | 'edit' | 'approve' | 'hidden'>('idle')
  const [isClicking, setIsClicking] = useState(false)
  const cycleTimeoutRef = useRef<NodeJS.Timeout[]>([])
  const sectionRef = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(true)

  // Clear all pending cycle timeouts
  const clearCycleTimers = () => {
    cycleTimeoutRef.current.forEach((timer) => clearTimeout(timer))
    cycleTimeoutRef.current = []
  }

  const [cycleKey, setCycleKey] = useState(0)

  // Pause the self-running demo (and the GPU compositing work its
  // continuous backdrop-blur/gradient updates require) while the section
  // is scrolled out of view. Previously this loop ran forever regardless
  // of visibility, forcing the browser to keep recompositing an expensive
  // backdrop-blur-2xl layer indefinitely — a likely contributor to mobile
  // Chromium rendering artifacts observed on nearby sections while
  // scrolling. Purely a performance/stability fix; the demo behaves
  // identically whenever it's actually visible.
  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Self-running continuous demonstration loop — only while in view.
  useEffect(() => {
    clearCycleTimers()
    if (!isInView) return

    const addTimer = (fn: () => void, delayMs: number) => {
      const t = setTimeout(fn, delayMs)
      cycleTimeoutRef.current.push(t)
      return t
    }

    if (selectedMode === 'autonomous') {
      // ── AUTONOMOUS MODE CYCLE (Automatic Continuous Product Demo) ────────
      setCursorTarget('hidden')
      setDispatchStage('drafting')

      addTimer(() => setDispatchStage('approved'), 700)
      addTimer(() => setDispatchStage('routing'), 1200)
      addTimer(() => setDispatchStage('whatsapp'), 1800)
      addTimer(() => setDispatchStage('email'), 2400)
      addTimer(() => setDispatchStage('sms'), 3000)
      addTimer(() => setDispatchStage('complete'), 3600)

      // Pause 3.5s then auto-replay
      addTimer(() => {
        setCycleKey((prev) => prev + 1)
      }, 7200)
    } else {
      // ── HUMAN APPROVAL MODE CYCLE (Simulated Pointer / Human-in-the-Loop) ──
      setDispatchStage('review')
      setCursorTarget('idle')

      // 1. Move cursor to Edit Copy button
      addTimer(() => {
        setCursorTarget('edit')
      }, 900)

      // 2. Click Edit Copy
      addTimer(() => {
        setIsClicking(true)
        setDispatchStage('editing')
      }, 1600)

      addTimer(() => {
        setIsClicking(false)
      }, 1900)

      // 3. Move cursor to Approve & Send button
      addTimer(() => {
        setCursorTarget('approve')
      }, 2600)

      // 4. Click Approve & Send
      addTimer(() => {
        setIsClicking(true)
        setDispatchStage('approved')
      }, 3400)

      addTimer(() => {
        setIsClicking(false)
        setCursorTarget('idle')
        setDispatchStage('routing')
      }, 3700)

      // 5. Sequential multi-channel dispatch
      addTimer(() => setDispatchStage('whatsapp'), 4200)
      addTimer(() => setDispatchStage('email'), 4800)
      addTimer(() => setDispatchStage('sms'), 5400)
      addTimer(() => setDispatchStage('complete'), 6000)

      // Pause 3.5s then auto-replay
      addTimer(() => {
        setCycleKey((prev) => prev + 1)
      }, 9800)
    }

    return () => clearCycleTimers()
  }, [selectedMode, cycleKey, isInView])

  const handleManualReplay = () => {
    clearCycleTimers()
    setCycleKey((prev) => prev + 1)
  }

  return (
    <section id="automation" ref={sectionRef} className="py-20 sm:py-32 relative overflow-hidden w-full max-w-full">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        {/* Rich Container Box */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-8 md:p-14 border border-brand-500/30 shadow-2xl overflow-hidden w-full">
          {/* Ambient Lighting Orbs — smaller/lighter blur on mobile only.
              These are large, mostly off-viewport decorative elements;
              their full-size blur radius is expensive to rasterize and
              recomposite on mobile GPUs, which — combined with the demo
              card's own backdrop-blur below — is the likely source of the
              rendering artifacts this fix addresses. Desktop (sm: and up)
              is unchanged. */}
          <div className="pointer-events-none absolute top-0 right-0 w-[260px] h-[260px] blur-[60px] sm:w-[500px] sm:h-[500px] sm:blur-[140px] bg-brand-500/15 rounded-full" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-[220px] h-[220px] blur-[55px] sm:w-[400px] sm:h-[400px] sm:blur-[130px] bg-purple-500/10 rounded-full" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Col: Explanation & Mode Switcher */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-300 border border-brand-500/30">
                <Bot className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                <span>AI &amp; Multi-Channel Automation</span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
                Autonomous Execution with Total Pastoral Control.
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                You decide whether AI actions run autonomously in the background or pause for human approval before sending any messages to your congregation.
              </p>

              {/* Mode Switcher: 1. Autonomous Mode (Default) | 2. Human Approval Mode */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Operating Mode to Preview Live Behavior:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: Autonomous Mode (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('autonomous')
                      handleManualReplay()
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selectedMode === 'autonomous'
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-lg ring-1 ring-emerald-400/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Autonomous Mode
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold uppercase">
                          Default
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Workflows run 24/7 in real-time as triggers occur without waiting.
                      </p>
                    </div>
                  </button>

                  {/* Mode 2: Human Approval Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('manual')
                      handleManualReplay()
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selectedMode === 'manual'
                        ? 'border-brand-400 bg-brand-500/20 shadow-lg ring-1 ring-brand-400/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Eye className="h-5 w-5 text-brand-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Human Approval Mode</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        AI drafts actions to a review queue; staff approve before dispatch.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Self-Running Interactive Simulation Card */}
            <div className="lg:col-span-6 relative">
              {/* backdrop-blur-2xl (40px) is expensive to keep recompositing
                  continuously on mobile GPUs; reduced to backdrop-blur-md
                  (12px, matching the cost already used elsewhere on this
                  page, e.g. CoreFeatures cards) below the sm: breakpoint.
                  Desktop appearance is unchanged. */}
              <div className="relative rounded-3xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur-md sm:backdrop-blur-2xl p-5 sm:p-7 space-y-5 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        dispatchStage === 'complete'
                          ? 'bg-emerald-400'
                          : ['routing', 'whatsapp', 'email', 'sms'].includes(dispatchStage)
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-brand-400 animate-pulse'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">
                      {selectedMode === 'autonomous'
                        ? '24/7 Autonomous Action Engine'
                        : 'Staff Safety Review Queue'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                      Live Demo Simulation
                    </span>
                    <button
                      type="button"
                      onClick={handleManualReplay}
                      title="Replay simulation"
                      className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* ── Message Card / Review State ──────────────────────────── */}
                <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                      1st-Time Guest Follow-Up Dispatch
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Trigger: Visitor Check-In</span>
                  </div>

                  {dispatchStage === 'editing' ? (
                    <div className="space-y-2">
                      <div className="w-full rounded-xl bg-zinc-900 border border-brand-500/60 p-3 text-xs text-zinc-100 leading-relaxed font-mono animate-pulse">
                        &ldquo;{messageText} (Reviewed &amp; personalized by Pastor Emmanuel)&rdquo;
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-brand-400 font-semibold">
                        <span>Staff personalization applied</span>
                        <span>Saving draft...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <p className="text-[11px] text-zinc-300 bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed">
                        &ldquo;{messageText}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Actions Ribbon */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] text-zinc-400">
                      Target: <strong className="text-white">New Sunday Visitors</strong>
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                      {selectedMode === 'manual' ? (
                        <>
                          <span
                            id="demo-edit-btn"
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                              dispatchStage === 'editing'
                                ? 'border-brand-400 bg-brand-500/20 text-brand-300 ring-2 ring-brand-400/50'
                                : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit Copy
                          </span>

                          <span
                            id="demo-approve-btn"
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-md ${
                              ['approved', 'routing', 'whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage)
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-brand-600 text-white hover:bg-brand-500'
                            }`}
                          >
                            <Send className="h-3 w-3" />
                            {['approved', 'routing', 'whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage)
                              ? 'Approved ✓'
                              : 'Approve & Send'}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {['approved', 'routing', 'whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage)
                            ? 'Auto-Approved in 0.5s'
                            : 'AI Analyzing...'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Simulated Animated Cursor (for Human Approval Mode) ─── */}
                  {selectedMode === 'manual' && cursorTarget !== 'hidden' && (
                    <motion.div
                      animate={{
                        x: cursorTarget === 'edit' ? 140 : cursorTarget === 'approve' ? 245 : 40,
                        y: cursorTarget === 'edit' ? 85 : cursorTarget === 'approve' ? 85 : 20,
                        scale: isClicking ? 0.85 : 1,
                        opacity: cursorTarget === 'idle' ? 0.4 : 1,
                      }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className="pointer-events-none absolute top-0 left-0 z-30 flex items-center gap-1 text-white drop-shadow-md"
                    >
                      <MousePointer className="h-5 w-5 text-brand-400 fill-brand-500" />
                      {isClicking && (
                        <span className="h-3 w-3 rounded-full bg-brand-400 animate-ping absolute -top-1 -left-1" />
                      )}
                    </motion.div>
                  )}
                </div>

                {/* ── Multi-Channel Pipeline Distribution Tracks ───────────── */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-brand-400" />
                      Multi-Channel Delivery Pipeline
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {dispatchStage === 'complete'
                        ? 'Completed'
                        : ['routing', 'whatsapp', 'email', 'sms'].includes(dispatchStage)
                        ? 'Broadcasting...'
                        : 'Standby'}
                    </span>
                  </div>

                  {/* Channel 1: WhatsApp Meta Cloud */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      ['whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage)
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : dispatchStage === 'routing'
                        ? 'border-brand-500/50 bg-brand-500/10 text-zinc-300 animate-pulse'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">WhatsApp Business Cloud</p>
                        <p className="text-[10px] text-zinc-400">1-to-1 Personal Welcome Message</p>
                      </div>
                    </div>
                    <div>
                      {['whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> Message Delivered
                        </span>
                      ) : dispatchStage === 'routing' ? (
                        <span className="text-[10px] text-brand-400 font-medium">Routing...</span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Ready</span>
                      )}
                    </div>
                  </div>

                  {/* Channel 2: Resend Verified Email */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      ['email', 'sms', 'complete'].includes(dispatchStage)
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : ['routing', 'whatsapp'].includes(dispatchStage)
                        ? 'border-brand-500/50 bg-brand-500/10 text-zinc-300 animate-pulse'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="h-7 w-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Resend Verified Email</p>
                        <p className="text-[10px] text-zinc-400">Weekly Bulletin &amp; Study Guide</p>
                      </div>
                    </div>
                    <div>
                      {['email', 'sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> Email Sent (SPF/DKIM)
                        </span>
                      ) : ['routing', 'whatsapp'].includes(dispatchStage) ? (
                        <span className="text-[10px] text-brand-400 font-medium">Routing...</span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Ready</span>
                      )}
                    </div>
                  </div>

                  {/* Channel 3: Direct SMS Gateway */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      ['sms', 'complete'].includes(dispatchStage)
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : ['routing', 'whatsapp', 'email'].includes(dispatchStage)
                        ? 'border-brand-500/50 bg-brand-500/10 text-zinc-300 animate-pulse'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Direct SMS Gateway</p>
                        <p className="text-[10px] text-zinc-400">Instant Prayer Fellowship Notice</p>
                      </div>
                    </div>
                    <div>
                      {['sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> SMS Delivered (Route 1)
                        </span>
                      ) : ['routing', 'whatsapp', 'email'].includes(dispatchStage) ? (
                        <span className="text-[10px] text-brand-400 font-medium">Routing...</span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Ready</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Summary Result Banner ────────────────────────────────── */}
                <AnimatePresence>
                  {dispatchStage === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-brand-500/15 p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-white">
                            {selectedMode === 'autonomous'
                              ? 'Autonomous Multi-Channel Workflow Dispatched'
                              : 'Approved by Staff & Successfully Dispatched'}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Simulated workflow delivered across 3 channels • Auto-replaying in 3s
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualReplay}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 transition-colors flex-shrink-0"
                      >
                        Replay
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
