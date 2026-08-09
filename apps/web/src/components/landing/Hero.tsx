'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Globe,
  Tv,
} from 'lucide-react'
import { RotatingGlobe } from './RotatingGlobe'

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
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* ── Continuous Rotating Global Globe in Background ──────────────── */}
      <RotatingGlobe />

      {/* ── Rich Ambient Background Mesh & Lighting ─────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.22),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-500/15 blur-[150px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Top Category Badge */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-card/80 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 shadow-sm backdrop-blur-md"
          >
            <Globe className="h-3.5 w-3.5 text-brand-500 animate-spin-slow" />
            <span>The Global Ministry Operating System</span>
          </motion.div>
        </div>

        {/* Hero Headline & Value Pitch */}
        <div className="mt-6 text-center max-w-4xl mx-auto space-y-5">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl leading-[1.1]"
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
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed text-balance"
          >
            Church Growth OS brings your people, communications, giving, events, sermons, discipleship follow-up, and automation into one intelligent platform built for modern churches.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Start Your 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-7 py-4 text-sm font-semibold text-foreground hover:bg-accent transition-all shadow-xs"
            >
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-2 flex items-center justify-center gap-5 text-xs font-medium text-muted-foreground flex-wrap"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              14-Day Free Trial
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-500" />
              No Credit Card Required
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Setup in Under 2 Minutes
            </span>
          </motion.div>
        </div>

        {/* ── Interactive Command Center Dashboard Mockup ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-14 sm:mt-18 relative mx-auto max-w-6xl"
        >
          {/* Ambient Glow behind Card */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-indigo-500/20 blur-xl opacity-80 pointer-events-none" />

          {/* Main Command Center Container */}
          <div className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-4 sm:p-7 shadow-2xl overflow-hidden ring-1 ring-border/50 space-y-5">
            {/* ── Centered LIVE Streaming Church Broadcast Bar ─────────────── */}
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-card/90 to-brand-500/10 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-black text-white shadow-md uppercase tracking-wider animate-pulse flex-shrink-0">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>LIVE SERVICE</span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                    Grace City Cathedral • 9:00 AM Sunday Celebration Service
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>📡 Multi-Casting to YouTube Live &amp; Facebook</span>
                  </p>
                </div>
              </div>

              {/* Animated Live Audio Waveform & Global Viewers */}
              <div className="flex items-center justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-border/40 pt-2 md:pt-0">
                <div className="flex items-end gap-1 h-4 text-rose-500">
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-foreground">{pulseCount} Global Viewers</span>
                  <p className="text-[10px] text-emerald-500 font-semibold">1080p 60fps HD Stream Active</p>
                </div>
              </div>
            </div>

            {/* Command Center Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                    Church Growth OS
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    Live Command Center
                  </span>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg transition-all relative ${
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
                  className={`px-3 py-1.5 rounded-lg transition-all relative ${
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
                  className={`px-3 py-1.5 rounded-lg transition-all relative ${
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
                  className="space-y-6"
                >
                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total Members</span>
                        <Users className="h-4 w-4 text-brand-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                        {pulseCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +12% this month
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>New Visitors (MTD)</span>
                        <UserPlus className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                        68
                      </div>
                      <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 84% 2nd-week retention
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Giving Reconciled</span>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                        ₦4.28M
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Paystack &amp; Bank Transfer
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Automations Active</span>
                        <Bot className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                        9 Workflows
                      </div>
                      <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Activity className="h-3 w-3" /> 100% Delivery SLA
                      </div>
                    </div>
                  </div>

                  {/* Operational Feed Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Discipleship Track */}
                    <div className="lg:col-span-7 rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-brand-500" />
                          Live Visitor Retention Velocity
                        </span>
                        <span className="text-[10px] text-muted-foreground">Past 30 Days</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Step 1: Check-in &amp; Day 1 Welcome</span>
                            <span className="font-bold text-foreground">100% (68/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full w-full" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Step 2: Midweek Pastoral Contact</span>
                            <span className="font-bold text-foreground">92% (62/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full w-[92%]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Step 3: Foundation Class Enrollment</span>
                            <span className="font-bold text-foreground">78% (53/68)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Broadcast Channels Live */}
                    <div className="lg:col-span-5 rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-3">
                      <span className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-emerald-500" />
                        Active Channels Status
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span>📱</span> WhatsApp Cloud API
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span>📧</span> Resend Email Gateway
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            DKIM Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/40">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span>💬</span> Termii SMS Sender
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
                  className="space-y-4"
                >
                  <div className="rounded-2xl border border-brand-500/40 bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-500" />
                        Pending Human Approval (Mode: Safety Review)
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">Trigger: 1st-Time Guest Check-in</span>
                    </div>
                    <div className="bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs space-y-1.5">
                      <p className="font-semibold text-foreground">
                        Generated WhatsApp Welcome Note:
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        "Good day David! Pastor Emmanuel and the entire family at Grace City Church were honored to host you this Sunday! We would love to know how we can pray for you this week..."
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-muted-foreground">Target: <strong>14 New Visitors</strong></span>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg border bg-background text-[11px] font-semibold text-muted-foreground hover:bg-accent cursor-pointer">
                          Edit Copy
                        </span>
                        <span className="px-3.5 py-1 rounded-lg bg-brand-600 text-white text-[11px] font-bold shadow-xs hover:bg-brand-500 cursor-pointer">
                          Approve &amp; Send Broadcast
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
                  className="space-y-4"
                >
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        Executive Daily 6:00 AM Pastoral Briefing
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Generated Automatically
                      </span>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border/40 text-xs space-y-2 text-muted-foreground">
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
