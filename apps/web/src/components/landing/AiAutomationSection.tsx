'use client'

import { useState, useEffect } from 'react'
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
  Check,
  Radio,
  Share2,
} from 'lucide-react'

type DispatchStage = 'idle' | 'approved' | 'routing' | 'whatsapp' | 'email' | 'sms' | 'complete'

export function AiAutomationSection() {
  const [selectedMode, setSelectedMode] = useState<'manual' | 'autonomous'>('manual')
  const [isEditing, setIsEditing] = useState(false)
  const [messageText, setMessageText] = useState(
    'Dear Sister Sarah, thank you for worshipping with Grace City today! Pastor Emmanuel and our team would love to share this week’s study notes with you and invite you to our midweek fellowship.'
  )
  const [dispatchStage, setDispatchStage] = useState<DispatchStage>('idle')

  // Auto-trigger workflow in Autonomous mode
  useEffect(() => {
    if (selectedMode === 'autonomous' && dispatchStage === 'idle') {
      const timer = setTimeout(() => {
        handleTriggerDispatch()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [selectedMode, dispatchStage])

  const handleTriggerDispatch = () => {
    if (dispatchStage !== 'idle') return
    setIsEditing(false)
    setDispatchStage('approved')

    setTimeout(() => {
      setDispatchStage('routing')
    }, 450)

    setTimeout(() => {
      setDispatchStage('whatsapp')
    }, 900)

    setTimeout(() => {
      setDispatchStage('email')
    }, 1400)

    setTimeout(() => {
      setDispatchStage('sms')
    }, 1900)

    setTimeout(() => {
      setDispatchStage('complete')
    }, 2400)
  }

  const handleReset = () => {
    setDispatchStage('idle')
    setIsEditing(false)
  }

  return (
    <section id="automation" className="py-20 sm:py-32 relative overflow-hidden w-full max-w-full">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        {/* Rich Dark Hero Box */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-8 md:p-14 border border-brand-500/30 shadow-2xl overflow-hidden w-full">
          {/* Ambient Lighting Orbs */}
          <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/15 blur-[140px] rounded-full" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Col: Explanation & Switcher */}
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

              {/* Mode Switcher Buttons */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Operating Mode to Preview Behavior:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('manual')
                      handleReset()
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

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('autonomous')
                      handleReset()
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selectedMode === 'autonomous'
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-lg ring-1 ring-emerald-400/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Autonomous Mode</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Workflows run 24/7 in real-time as triggers occur without waiting.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Highly Polished Interactive Multi-Channel Simulation */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur-2xl p-5 sm:p-7 space-y-5 shadow-2xl ring-1 ring-white/10">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        dispatchStage === 'complete'
                          ? 'bg-emerald-400'
                          : dispatchStage !== 'idle'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-brand-400 animate-pulse'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">
                      {dispatchStage === 'complete'
                        ? 'Multi-Channel Dispatch Complete'
                        : selectedMode === 'manual'
                        ? 'Safety Review Queue'
                        : '24/7 Autonomous Engine'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                    Live Demo Simulation
                  </span>
                </div>

                {/* ── Message Card / Editable Box ──────────────────────────── */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                      1st-Time Guest Follow-Up Dispatch
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Trigger: Visitor Check-In</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl bg-zinc-900 border border-brand-500/50 p-3 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{messageText.length} characters</span>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <p className="text-[11px] text-zinc-300 bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed">
                        "{messageText}"
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] text-zinc-400">
                      Target Audience: <strong className="text-white">14 First-Time Guests</strong>
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {dispatchStage === 'idle' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-[11px] font-semibold hover:bg-zinc-700 transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            {isEditing ? 'Cancel' : 'Edit Copy'}
                          </button>

                          <button
                            type="button"
                            onClick={handleTriggerDispatch}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 text-white text-[11px] font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-500 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Send className="h-3 w-3" />
                            Approve &amp; Send
                          </button>
                        </>
                      )}

                      {dispatchStage !== 'idle' && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-[11px] font-semibold hover:bg-zinc-700 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reset Simulation
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Multi-Channel Pipeline Distribution Tracks ───────────── */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-brand-400" />
                      Multi-Channel Delivery Pipeline Status
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {dispatchStage === 'idle'
                        ? 'Standby'
                        : dispatchStage === 'complete'
                        ? '100% Delivered'
                        : 'Broadcasting...'}
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
                        <p className="font-semibold text-white">WhatsApp Business Cloud API</p>
                        <p className="text-[10px] text-zinc-400">1-to-1 Personal Welcome Note</p>
                      </div>
                    </div>
                    <div>
                      {['whatsapp', 'email', 'sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> Delivered (98.4% Open Rate)
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
                        <p className="font-semibold text-white">Resend Custom-Domain Email</p>
                        <p className="text-[10px] text-zinc-400">Weekly Bulletin &amp; Study Guide</p>
                      </div>
                    </div>
                    <div>
                      {['email', 'sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> Sent (SPF/DKIM Verified)
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
                        <p className="font-semibold text-white">Direct SMS Sender ID</p>
                        <p className="text-[10px] text-zinc-400">Instant Prayer Circle Notification</p>
                      </div>
                    </div>
                    <div>
                      {['sms', 'complete'].includes(dispatchStage) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" /> Delivered (Route 1)
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
                          <p className="font-bold text-white">245 Congregation Members Reached</p>
                          <p className="text-[10px] text-zinc-400">
                            Delivered across 3 channels in 1.8 seconds • Immutable Audit Log Created
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 transition-colors flex-shrink-0"
                      >
                        Replay Demo
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
