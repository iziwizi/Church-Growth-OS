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
import { NetworkGraph } from './NetworkGraph'

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
    <section className="relative isolate pt-28 pb-20 sm:pt-36 sm:pb-28 md:pt-44 md:pb-36 overflow-hidden w-full max-w-full bg-[#070913] text-white">
      {/* ── Layer 2: Subtle Church Sanctuary Atmosphere Backdrop ────────── */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <Image
          src="/hero-church-bg.jpg"
          alt="Modern Ministry Church Worship Sanctuary"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45 sm:opacity-55 scale-105 transition-transform duration-1000"
        />

        {/* Sophisticated Layered Gradient & Contrast Masks */}
        {/* Darkening directly behind the headline area */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_20%,rgba(7,9,19,0.92)_0%,rgba(7,9,19,0.65)_70%,rgba(7,9,19,0.4)_100%)]" />
        {/* Vertical fades */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#070913]/55 to-[#070913]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070913]/90 via-transparent to-[#070913]" />

        {/* Layer 3: Subtle Purple/Indigo Atmospheric Lighting Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(99,102,241,0.2),transparent_75%)]" />

        {/* Bottom smooth fade to transparent */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* ── Layer 4: Minimal Abstract Intelligence Network Visual ──────── */}
      <NetworkGraph />

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        {/* Hero Headline & Value Pitch */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15] sm:leading-[1.1] px-1 drop-shadow-sm"
          >
            Run Your Church.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Grow Your Ministry.
            </span>{' '}
            One Intelligent Platform.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed text-balance px-2"
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-2xl shadow-brand-500/40 hover:from-brand-400 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Start Your 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-all shadow-xs"
            >
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="pt-2 flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-medium text-zinc-400 flex-wrap px-2"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-400 flex-shrink-0" />
              14-Day Free Trial
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-400 flex-shrink-0" />
              No Credit Card Required
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-400 flex-shrink-0" />
              Instant 2-Minute Setup
            </span>
          </motion.div>
        </div>

        {/* ── Interactive Command Center Dashboard Mockup ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 sm:mt-18 relative mx-auto max-w-6xl w-full"
        >
          {/* Ambient Glow behind Card */}
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-brand-500/30 via-purple-500/25 to-indigo-500/30 blur-2xl opacity-90 pointer-events-none" />

          {/* Main Command Center Container */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/15 bg-zinc-900/90 backdrop-blur-2xl p-3.5 sm:p-7 shadow-2xl overflow-hidden ring-1 ring-white/10 space-y-4 sm:space-y-5 w-full text-zinc-100">
            {/* ── Centered LIVE Streaming Church Broadcast Bar ─────────────── */}
            <div className="rounded-xl sm:rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/20 via-zinc-900 to-brand-500/20 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black text-white shadow-md uppercase tracking-wider animate-pulse flex-shrink-0">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white animate-ping" />
                  <span>LIVE SERVICE</span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    Grace City Cathedral • 9:00 AM Sunday Service
                  </p>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 truncate">
                    <span>📡 Multi-Casting to YouTube Live &amp; Facebook</span>
                  </p>
                </div>
              </div>

              {/* Animated Live Audio Waveform & Global Viewers */}
              <div className="flex items-center justify-between w-full md:w-auto gap-3 sm:gap-4 border-t md:border-t-0 border-white/10 pt-2 md:pt-0">
                <div className="flex items-end gap-1 h-3.5 sm:h-4 text-rose-500">
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2.5 sm:h-3" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3.5 sm:h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3.5 sm:h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2.5 sm:h-3" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white">{pulseCount} Global Viewers</span>
                  <p className="text-[10px] text-emerald-400 font-semibold">1080p 60fps HD Active</p>
                </div>
              </div>
            </div>

            {/* Command Center Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs sm:text-sm font-bold text-white">
                    Church Growth OS
                  </span>
                  <span className="text-[10px] font-semibold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-md border border-brand-500/30">
                    Command Center
                  </span>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 flex items-center gap-1 bg-zinc-800/80 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'overview'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ministry Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('automation')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'automation'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Approval Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('growth')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    activeTab === 'growth'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
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
                    <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/50 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                        <span className="truncate">Total Members</span>
                        <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-400 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-white">
                        {pulseCount.toLocaleString()}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                        <TrendingUp className="h-3 w-3 flex-shrink-0" /> +12% MTD
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/50 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                        <span className="truncate">New Visitors</span>
                        <UserPlus className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-400 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-white">
                        68
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                        <TrendingUp className="h-3 w-3 flex-shrink-0" /> 84% Retention
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/50 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                        <span className="truncate">Giving</span>
                        <DollarSign className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-400 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-white">
                        ₦4.28M
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-zinc-400 font-medium truncate">
                        Reconciled
                      </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/50 p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                        <span className="truncate">Workflows</span>
                        <Bot className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-400 flex-shrink-0" />
                      </div>
                      <div className="text-base sm:text-2xl font-extrabold text-white">
                        9 Active
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                        <Activity className="h-3 w-3 flex-shrink-0" /> 100% SLA
                      </div>
                    </div>
                  </div>

                  {/* Operational Feed Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 w-full">
                    {/* Discipleship Track */}
                    <div className="lg:col-span-7 rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/30 p-3.5 sm:p-4 space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                          Live Visitor Retention Velocity
                        </span>
                        <span className="text-[10px] text-zinc-400">Past 30 Days</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-300 truncate">Step 1: Check-in &amp; Day 1 Welcome</span>
                            <span className="font-bold text-white flex-shrink-0">100% (68/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full w-full" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-300 truncate">Step 2: Midweek Pastoral Contact</span>
                            <span className="font-bold text-white flex-shrink-0">92% (62/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full w-[92%]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-300 truncate">Step 3: Foundation Class</span>
                            <span className="font-bold text-white flex-shrink-0">78% (53/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Broadcast Channels Live */}
                    <div className="lg:col-span-5 rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/30 p-3.5 sm:p-4 space-y-3 w-full">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        Active Channels Status
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-white/10">
                          <span className="flex items-center gap-2 font-medium text-white truncate">
                            <span>📱</span> WhatsApp Cloud
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-white/10">
                          <span className="flex items-center gap-2 font-medium text-white truncate">
                            <span>📧</span> Resend Email
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                            DKIM Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-white/10">
                          <span className="flex items-center gap-2 font-medium text-white truncate">
                            <span>💬</span> Termii SMS
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
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
                  <div className="rounded-xl sm:rounded-2xl border border-brand-500/40 bg-zinc-800/60 p-3.5 sm:p-5 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-400 flex-shrink-0" />
                        Pending Human Approval (Mode: Safety Review)
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Trigger: 1st Guest Check-in</span>
                    </div>
                    <div className="bg-zinc-900/80 p-3 sm:p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5">
                      <p className="font-semibold text-white">
                        Generated WhatsApp Welcome Note:
                      </p>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        &ldquo;Good day David! Pastor Emmanuel and the entire family at Grace City Church were honored to host you this Sunday! We would love to know how we can pray for you this week...&rdquo;
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                      <span className="text-[11px] text-zinc-400">Target: <strong>14 New Visitors</strong></span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg border border-white/15 bg-zinc-800 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 cursor-pointer">
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
                  <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-800/60 p-3.5 sm:p-5 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        Executive Daily 6:00 AM Pastoral Briefing
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                        Generated Automatically
                      </span>
                    </div>
                    <div className="bg-zinc-900/80 p-3.5 sm:p-4 rounded-xl border border-white/10 text-xs space-y-2 text-zinc-300">
                      <p className="text-white font-semibold">
                        Pastor Emmanuel, here is your 24-hour ministry snapshot:
                      </p>
                      <ul className="space-y-1.5 text-[11px] list-disc list-inside text-zinc-300">
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
