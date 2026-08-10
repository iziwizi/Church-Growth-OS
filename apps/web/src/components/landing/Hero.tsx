'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Users,
  UserPlus,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  Bot,
  Radio,
  BarChart3,
  HeartHandshake,
  DollarSign,
  Clock,
  Send,
  Zap,
} from 'lucide-react'

export function LandingHero() {
  const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'growth'>('overview')
  const [pulseCount, setPulseCount] = useState(482)

  // Subtle live pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((prev) => prev + (Math.random() > 0.5 ? 1 : 0))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative isolate pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32 overflow-hidden w-full max-w-full">
      {/* ── Cinematic Church Background with Dark Gradient Overlay ──────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/hero-church-bg.jpg"
          alt="Modern Ministry Church Worship"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-25 dark:opacity-20 scale-105 transition-transform duration-1000"
        />
        {/* Multi-layered Vignette & Soft Gradient for Perfect Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_15%,rgba(99,102,241,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        {/* Hero Headline & Value Pitch */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.15] sm:leading-[1.1] px-1"
          >
            Run Your Church.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
              Grow Your Ministry.
            </span>{' '}
            One Intelligent Platform.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed text-balance px-2"
          >
            Church Growth OS brings your people, communications, giving, events, sermons, discipleship follow-up, and automation into one intelligent platform built for modern churches.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 px-2 sm:px-0"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Start Your 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-foreground hover:bg-accent transition-all shadow-xs"
            >
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="pt-2 flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-medium text-muted-foreground flex-wrap px-2"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-500 flex-shrink-0" />
              14-Day Free Trial
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-500 flex-shrink-0" />
              No Credit Card Required
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-500 flex-shrink-0" />
              Instant 2-Minute Setup
            </span>
          </motion.div>
        </div>

        {/* ── Interactive Command Center Dashboard Mockup ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 sm:mt-16 relative mx-auto max-w-6xl w-full"
        >
          {/* Ambient Glow behind Card */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-indigo-500/20 blur-xl opacity-80 pointer-events-none" />

          {/* Main Command Center Container */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-3.5 sm:p-7 shadow-2xl overflow-hidden ring-1 ring-border/50 space-y-4 sm:space-y-5 w-full">
            {/* ── Centered LIVE Streaming Church Broadcast Bar ─────────────── */}
            <div className="rounded-xl sm:rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-card/95 to-brand-500/10 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black text-white shadow-md uppercase tracking-wider animate-pulse flex-shrink-0">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white animate-ping" />
                  <span>LIVE SERVICE</span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                    Grace City Cathedral • 9:00 AM Sunday Service
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                    <span>📡 Multi-Casting to YouTube Live &amp; Facebook</span>
                  </p>
                </div>
              </div>

              {/* Animated Live Audio Waveform & Global Viewers */}
              <div className="flex items-center justify-between w-full md:w-auto gap-3 sm:gap-4 border-t md:border-t-0 border-border/40 pt-2 md:pt-0">
                <div className="flex items-end gap-1 h-3.5 sm:h-4 text-rose-500">
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2.5 sm:h-3" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3.5 sm:h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3.5 sm:h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2.5 sm:h-3" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-foreground">{pulseCount} Global Viewers</span>
                  <p className="text-[10px] text-emerald-500 font-semibold">1080p 60fps HD Stream Active</p>
                </div>
              </div>
            </div>

            {/* Command Center Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3 sm:pb-4 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                    Church Growth OS
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    Command Center
                  </span>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'overview'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ministry Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('automation')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'automation'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Approval Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('growth')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'growth'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Growth Intelligence
                </button>
              </div>
            </div>

            {/* Tab View 1: Overview */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6 w-full"
                >
                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
                    <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate">Total Members</span>
                        <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-500 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-foreground">
                        {pulseCount.toLocaleString()}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-500 font-semibold flex items-center gap-1 truncate">
                        <TrendingUp className="h-3 w-3 flex-shrink-0" /> +12% MTD
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate">New Visitors</span>
                        <UserPlus className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-500 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-foreground">
                        68
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-500 font-semibold flex items-center gap-1 truncate">
                        <TrendingUp className="h-3 w-3 flex-shrink-0" /> 84% Retention
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate">Giving</span>
                        <DollarSign className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-500 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-foreground">
                        ₦4.28M
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">
                        Reconciled
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate">Workflows</span>
                        <Bot className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-500 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-foreground">
                        9 Active
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-500 font-semibold flex items-center gap-1 truncate">
                        <Activity className="h-3 w-3 flex-shrink-0" /> 100% SLA
                      </div>
                    </div>
                  </div>

                  {/* Operational Feed Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 w-full">
                    {/* Discipleship Track */}
                    <div className="lg:col-span-7 rounded-xl sm:rounded-2xl border border-border/60 bg-muted/10 p-3.5 sm:p-4 space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                          Live Visitor Retention Velocity
                        </span>
                        <span className="text-[10px] text-muted-foreground">Past 30 Days</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground truncate">Step 1: Check-in &amp; Day 1 Welcome</span>
                            <span className="font-bold text-foreground flex-shrink-0">100% (68/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full w-full" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground truncate">Step 2: Midweek Pastoral Contact</span>
                            <span className="font-bold text-foreground flex-shrink-0">92% (62/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full w-[92%]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground truncate">Step 3: Foundation Class</span>
                            <span className="font-bold text-foreground flex-shrink-0">78% (53/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Broadcast Channels Live */}
                    <div className="lg:col-span-5 rounded-xl sm:rounded-2xl border border-border/60 bg-muted/10 p-3.5 sm:p-4 space-y-3 w-full">
                      <span className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        Active Channels Status
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground truncate">
                            <span>📱</span> WhatsApp Cloud
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground truncate">
                            <span>📧</span> Resend Email
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            DKIM Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground truncate">
                            <span>💬</span> Termii SMS
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            Route 1
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab View 2: Approval Queue */}
              {activeTab === 'automation' && (
                <motion.div
                  key="automation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 w-full"
                >
                  <div className="rounded-xl sm:rounded-2xl border border-brand-500/40 bg-card p-3.5 sm:p-5 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-500 flex-shrink-0" />
                        Pending Human Approval (Mode: Safety Review)
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">Trigger: 1st Guest Check-in</span>
                    </div>
                    <div className="bg-muted/30 p-3 sm:p-3.5 rounded-xl border border-border/50 text-xs space-y-1.5">
                      <p className="font-semibold text-foreground">
                        Generated WhatsApp Welcome Note:
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        "Good day David! Pastor Emmanuel and the entire family at Grace City Church were honored to host you this Sunday! We would love to know how we can pray for you this week..."
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                      <span className="text-[11px] text-muted-foreground">Target: <strong>14 New Visitors</strong></span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg border bg-background text-[11px] font-semibold text-muted-foreground hover:bg-accent cursor-pointer">
                          Edit Copy
                        </span>
                        <span className="flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-bold shadow-xs hover:bg-brand-500 cursor-pointer">
                          Approve &amp; Send
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab View 3: Growth Intelligence */}
              {activeTab === 'growth' && (
                <motion.div
                  key="growth"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 w-full"
                >
                  <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 p-3.5 sm:p-5 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        Executive Daily 6:00 AM Pastoral Briefing
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                        Generated Automatically
                      </span>
                    </div>
                    <div className="bg-card p-3.5 sm:p-4 rounded-xl border border-border/40 text-xs space-y-2 text-muted-foreground">
                      <p className="text-foreground font-semibold">
                        Pastor Emmanuel, here is your 24-hour ministry snapshot:
                      </p>
                      <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                        <li><strong>Sunday Attendance:</strong> 482 attendees (+8% vs 4-week average).</li>
                        <li><strong>Visitors Followed Up:</strong> 14 guests received personal pastoral WhatsApp messages.</li>
                        <li><strong>Prayer Requests Logged:</strong> 6 urgent needs routed to the intercessory team.</li>
                        <li><strong>Giving Target Velocity:</strong> 94% toward monthly building outreach fund.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
