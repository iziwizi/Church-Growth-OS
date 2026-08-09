'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

export function LandingHero() {
  const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'growth'>('overview')

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Product Category Badge */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 shadow-xs backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
            <span>The Intelligent Ministry Platform</span>
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
            <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 bg-clip-text text-transparent">
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
            Church Growth OS brings your people, communication, giving, events, content, automation, and ministry operations into one intelligent platform built for modern churches.
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:scale-[1.02] transition-all"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-1 flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground flex-wrap"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14-Day Free Trial
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No Credit Card Required
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Designed for Ministry Growth
            </span>
          </motion.div>
        </div>

        {/* High-Fidelity Product UI Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl border border-border/70 bg-card/80 p-2 sm:p-3.5 shadow-2xl shadow-brand-900/10 backdrop-blur-xl ring-1 ring-white/10">
            {/* Mock Window Top Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <span className="ml-2 text-[11px] font-mono text-muted-foreground hidden sm:inline">
                  app.churchgrowthos.com/dashboard
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 rounded-lg transition-all ${
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
                  className={`px-3 py-1 rounded-lg transition-all ${
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
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'growth'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Growth Intelligence
                </button>
              </div>
            </div>

            {/* Mock Content Body */}
            {activeTab === 'overview' && (
              <div className="space-y-4 p-2 sm:p-4">
                {/* Header Strip inside preview */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Grace City Cathedral
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sunday Service Command Center • 14-Day Free Trial
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                      <Bot className="h-3.5 w-3.5" />
                      AI Autonomous Mode
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      Preflight Ready
                    </span>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-medium">Congregation</span>
                      <Users className="h-4 w-4 text-brand-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-display">1,480</div>
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +12% this month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-medium">First-Time Visitors</span>
                      <UserPlus className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-display">38</div>
                    <p className="text-[10px] text-brand-500 font-semibold">100% Nurture Active</p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-medium">AI Credits</span>
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-display">24,500</div>
                    <p className="text-[10px] text-muted-foreground">98% Available</p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-medium">Weekly Giving</span>
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-display">₦2.4M</div>
                    <p className="text-[10px] text-emerald-500 font-semibold">Online & Bank Reconciled</p>
                  </div>
                </div>

                {/* Workflow Split Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Recent Autonomous Actions</span>
                      <span className="text-[10px] text-brand-500 font-semibold">Live Feed</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                        <span className="text-muted-foreground">Welcome SMS & WhatsApp to Sunday visitors</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Dispatched</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                        <span className="text-muted-foreground">Pastor's Midweek Prayer notification</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Scheduled</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-background/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Live Streaming Destination</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Configured</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p>YouTube Live: <span className="text-foreground font-semibold">youtube.com/@GraceCityCathedral/live</span></p>
                      <p>Audience Promotion: <span className="text-foreground font-semibold">WhatsApp + Email Broadcasts</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground">Human Approval Queue (Manual Mode)</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">1 Action Pending Approval</span>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Visitor Re-engagement Outreach</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Trigger: 3-Day Inactivity</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    "Hi David! Pastor Emmanuel and the Grace City family are praying for you this week. Would you love to join a home fellowship near Lekki Phase 1?"
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button className="px-3 py-1 rounded-xl border text-xs text-muted-foreground">Reject</button>
                    <button className="px-3 py-1 rounded-xl border text-xs text-foreground">Edit &amp; Approve</button>
                    <button className="px-3 py-1 rounded-xl bg-brand-600 text-white font-semibold text-xs">Approve &amp; Send</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground">6:00 AM Executive Pastoral Growth Briefing</span>
                  <span className="text-[10px] text-brand-500 font-bold">Generated Today</span>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Key Highlights for Senior Pastor:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Visitor conversion rate increased to <strong className="text-foreground">42%</strong> over the past 3 weeks.</li>
                    <li><strong className="text-foreground">18 new prayer requests</strong> assigned to Intercessory Ministry Leaders.</li>
                    <li>Sunday Live stream reached <strong className="text-foreground">1,240 peak concurrent viewers</strong>.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
