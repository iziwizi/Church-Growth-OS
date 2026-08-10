'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  CheckCheck,
  Send,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
} from 'lucide-react'

const CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Meta Cloud',
    icon: MessageSquare,
    badge: 'High Open Rate',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    desc: 'Official WhatsApp Business Cloud API for 1-to-1 welcome chats, service reminders, and prayer circle updates with zero number bans.',
    sample: 'Dear Sister Sarah, thank you for worshipping at Grace City today! Pastor Emmanuel and the team would love to share this week’s study notes and welcome you to our midweek fellowship.',
    meta: 'Delivered instantly via Meta Graph API v20.0',
    stat: '98% Delivery Rate',
  },
  {
    id: 'email',
    name: 'Resend Verified Email',
    icon: Mail,
    badge: 'Deliverability Engine',
    color: 'text-brand-500',
    bg: 'bg-brand-500/10',
    desc: 'Custom-domain DKIM/SPF verified transactional email for weekly pastoral letters, giving receipts, and service bulletins.',
    sample: 'Grace City Weekly Bulletin: Sunday Message Summary, Midweek Life Groups, and upcoming Youth Camp Registration details.',
    meta: 'Custom Domain DKIM / SPF Verified (mujteknify.com)',
    stat: '68% Open Rate',
  },
  {
    id: 'sms',
    name: 'Direct SMS Gateway',
    icon: Smartphone,
    badge: 'Instant Reach',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    desc: 'Dedicated SMS sender ID for instant prayer alerts, emergency schedule updates, and urgent ministry notices.',
    sample: 'GraceCity: Reminder! Special Miracle Service starts today at 6:00 PM. Join us in-person or online at gracecity.church/live',
    meta: 'High-Priority Delivery via Termii Gateway',
    stat: 'Instant SMS Receipt',
  },
  {
    id: 'inapp',
    name: 'In-App & Worker Alerts',
    icon: Bell,
    badge: 'Internal Synergy',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    desc: 'Targeted notifications for department leaders, ushering teams, intercessors, and pastoral staff.',
    sample: 'New Visitor Assigned: Brother John Davis has been routed to the Welcome Department for 24h follow-up.',
    meta: 'Real-time WebSocket Push Notifications',
    stat: 'Staff Coordination',
  },
]

export function CommunicationsShowcase() {
  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const current = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0]

  return (
    <section className="py-20 sm:py-32 bg-muted/30 border-y border-border/50 relative overflow-hidden w-full max-w-full">
      {/* Background Ambient Glow — smaller/lighter blur on mobile only; this
          element is mostly off-viewport at narrow widths and its large
          blur radius is expensive to recomposite on mobile GPUs during
          scroll. Desktop (sm: and up) is unchanged. */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 w-[300px] h-[180px] blur-[70px] sm:w-[600px] sm:h-[350px] sm:blur-[150px] bg-brand-500/10 rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Multi-Channel Outreach</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Reach Your Congregation Wherever They Are.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Send targeted broadcasts across WhatsApp, Email, SMS, and in-app notifications. Combine channels or let members receive messages on their preferred platform.
          </p>
        </div>

        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Channel Selector List (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              const isSelected = ch.id === activeChannel
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-brand-500 bg-card shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/30 scale-[1.02]'
                      : 'border-border/80 bg-card/60 hover:bg-card hover:border-border'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md'
                        : `${ch.bg} ${ch.color}`
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground truncate">{ch.name}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {ch.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Live Preview Box (Right 7 Cols) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-2xl ${current.bg} ${current.color} flex items-center justify-center shadow-xs`}>
                      <current.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{current.name}</h4>
                      <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5" /> {current.stat}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground font-bold border border-border/40">
                    Live Broadcast Preview
                  </span>
                </div>

                {/* Message Bubble simulation */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>To: <strong className="text-foreground">First-Time Visitors (Sunday Service)</strong></span>
                    <span>10:45 AM</span>
                  </div>

                  <div className="rounded-2xl bg-background border border-border/60 p-4 text-xs sm:text-sm text-foreground leading-relaxed shadow-xs font-normal">
                    {current.sample}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="text-[10px]">Sender: <strong>Grace City Cathedral</strong></span>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {current.meta}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground">Audience Segmentation</p>
                    <p className="font-bold text-foreground">Departments, Visitors, Leaders</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground">Compliance &amp; Opt-outs</p>
                    <p className="font-bold text-foreground">Automated Stop Handling</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
