'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  Eye,
  Sliders,
  MessageSquare,
  Send,
} from 'lucide-react'

export function AiAutomationSection() {
  const [selectedMode, setSelectedMode] = useState<'manual' | 'autonomous'>('manual')
  const [isApproved, setIsApproved] = useState(false)

  const handleApprove = () => {
    setIsApproved(true)
    setTimeout(() => setIsApproved(false), 4000)
  }

  return (
    <section id="automation" className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Rich Dark Hero Box */}
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-14 border border-brand-500/30 shadow-2xl overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/15 blur-[140px] rounded-full" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Explanation & Switcher */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-300 border border-brand-500/30">
                <Bot className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                <span>AI &amp; Automation Architecture</span>
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
                    onClick={() => setSelectedMode('manual')}
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
                    onClick={() => setSelectedMode('autonomous')}
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

            {/* Right Col: Live Interactive Visual Card */}
            <div className="lg:col-span-6">
              <motion.div
                layout
                className="rounded-3xl border border-zinc-700/80 bg-zinc-900/90 backdrop-blur-2xl p-6 sm:p-8 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      {selectedMode === 'manual' ? 'Pending Approval Queue' : 'Autonomous Action Engine'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Mode: {selectedMode === 'manual' ? 'Safety Review' : '24/7 Live'}
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                      AI Follow-up Dispatch
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Trigger: 1st Visit</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-zinc-400 font-medium text-[11px]">
                      Why AI recommends this action:
                    </p>
                    <p className="text-[11px] text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 leading-relaxed">
                      "14 first-time guests checked in during 9:00 AM Sunday service. Immediate welcoming communication significantly improves retention."
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400">Target: <strong className="text-white">14 Visitors</strong></span>
                    {selectedMode === 'manual' ? (
                      <div className="flex gap-2">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md animate-bounce">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched!
                          </span>
                        ) : (
                          <>
                            <span className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-[11px] font-semibold hover:bg-zinc-700 cursor-pointer">
                              Edit Note
                            </span>
                            <button
                              type="button"
                              onClick={handleApprove}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-brand-600 text-white text-[11px] font-bold shadow-md hover:bg-brand-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <Send className="h-3 w-3" />
                              Approve &amp; Send
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Dispatched in 3s
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Audit Logging: <strong className="text-zinc-200">Immutable Firestore Record</strong></span>
                  <span>AI Credits: <strong className="text-brand-400">14 Used</strong></span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
