'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  UserCheck,
  MessageSquare,
} from 'lucide-react'

export function AiAutomationSection() {
  const [selectedMode, setSelectedMode] = useState<'autonomous' | 'manual'>('manual')

  return (
    <section id="automation" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
            <Bot className="h-3.5 w-3.5" />
            <span>Intelligent Ministry Workflows</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Let Your Church Work Smarter, Not Harder.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            AI assists your staff and leaders behind the scenes. You choose how much autonomy the system has with our dual-mode operating control.
          </p>
        </div>

        {/* Dual Mode Switcher Banner */}
        <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Ministry Autonomy Level
              </h3>
              <p className="text-xs text-muted-foreground">
                Switch operating mode per church anytime from your Settings or Automation tab.
              </p>
            </div>

            {/* Mode Buttons */}
            <div className="flex items-center p-1.5 rounded-2xl bg-muted/40 border border-border/60">
              <button
                type="button"
                onClick={() => setSelectedMode('manual')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMode === 'manual'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Human Approval Mode
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('autonomous')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMode === 'autonomous'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Autonomous Mode
              </button>
            </div>
          </div>

          {/* Interactive Card Explaining Active Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                {selectedMode === 'manual' ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    <span>Human Approval Safety Queue</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 text-purple-500" />
                    <span>Autonomous 24/7 Execution Engine</span>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {selectedMode === 'manual'
                  ? 'AI prepares intelligent drafts, selects targeted visitor cohorts, and places recommendations in your Approval Queue. Nothing is dispatched until a pastor or worker reviews and clicks Approve.'
                  : 'Eligible automations execute seamlessly in the background. First-time visitors receive prompt welcoming messages, prayer requests get acknowledged, and Sunday bulletins dispatch automatically.'}
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{selectedMode === 'manual' ? 'Review message wording before sending' : 'Zero lag in first-time visitor engagement'}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{selectedMode === 'manual' ? 'Audit log records who approved and when' : 'Weekly execution summaries in your daily report'}</span>
                </div>
              </div>
            </div>

            {/* Simulated Live UI Box */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                  Proposed AI Action
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Trigger: 1st Visit</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-muted-foreground font-semibold">
                  Why AI recommends this action:
                </p>
                <p className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/40">
                  "14 first-time guests checked in during 9:00 AM Sunday service. Immediate welcoming communication significantly improves retention."
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">Target: <strong className="text-foreground">14 Visitors</strong></span>
                {selectedMode === 'manual' ? (
                  <div className="flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg border bg-background text-[10px] font-semibold text-muted-foreground">Edit</span>
                    <span className="px-3 py-1 rounded-lg bg-brand-600 text-white text-[10px] font-bold">Approve</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                    Auto-Dispatched
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 text-center border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground">
              "AI assists your team. Your leaders stay in control."
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
