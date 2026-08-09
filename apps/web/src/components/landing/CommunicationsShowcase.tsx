'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  Send,
} from 'lucide-react'

const CHANNELS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Cloud API',
    icon: Smartphone,
    color: 'text-emerald-500',
    badge: 'Verified Meta WABA',
    header: 'Official Ministry WhatsApp Broadcast',
    previewContent: (
      <div className="space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs space-y-2 text-foreground">
          <p className="font-bold text-emerald-600 dark:text-emerald-400">Grace City Church</p>
          <p className="leading-relaxed">
            "Hello Sister Sarah! We missed you at prayer fellowship yesterday. We are holding a special online discipleship session this Thursday at 7:00 PM. Here is your private join link:"
          </p>
          <div className="p-2 rounded-xl bg-card border border-emerald-500/30 text-[11px] font-mono text-brand-500">
            https://gracecity.church/join/sarah-482
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground pt-1">
            <span>9:04 AM</span>
            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'email',
    label: 'Resend Verified Email',
    icon: Mail,
    color: 'text-brand-500',
    badge: 'Custom Domain DKIM',
    header: 'HTML Ministry Bulletin & Devotional',
    previewContent: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-card border border-border/80 p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px] text-muted-foreground">
            <span><strong>From:</strong> Pastor Emmanuel &lt;pastor@mujteknify.com&gt;</span>
            <span><strong>Subject:</strong> Walking in Dominion</span>
          </div>
          <p className="text-foreground font-semibold">Weekly Ministry Word &amp; Bulletin</p>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            "Grace and peace beloved family. In this Sunday's teaching, we explore how covenant positioning unlocks supernatural favor in your workplace..."
          </p>
          <div className="pt-2 flex justify-between items-center text-[10px] text-emerald-500 font-semibold">
            <span>Delivered via Resend Dedicated IP</span>
            <span>Open Rate: 68.4%</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'sms',
    label: 'Direct SMS Gateway',
    icon: MessageSquare,
    color: 'text-amber-500',
    badge: 'Termii Sender ID',
    header: 'Urgent Service & Meeting Alerts',
    previewContent: (
      <div className="space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-amber-500/10 border border-amber-500/20 p-4 text-xs space-y-2 text-foreground">
          <div className="flex justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <span>SENDER: GRACE-CITY</span>
            <span>Priority Route</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            "REMINDER: Midweek Miracle Service starts in 45 minutes at Main Sanctuary. Free shuttle buses are now departing from all 5 campus pickup zones."
          </p>
          <div className="flex items-center justify-end text-[10px] text-muted-foreground">
            <span>Delivered to 850 Members</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'inapp',
    label: 'In-App Alerts',
    icon: Bell,
    color: 'text-purple-500',
    badge: 'Real-time WebSocket',
    header: 'Live Staff & Department Notifications',
    previewContent: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
            <Bell className="h-4 w-4" />
            <span>Ushering Department Roster Assigned</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            "Brother Michael, you have been rostered as Lead Greeter for the 11:00 AM 2nd Service this Sunday. Please confirm your availability."
          </p>
          <div className="flex gap-2 pt-1">
            <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold">Confirm</span>
            <span className="px-3 py-1 bg-card border rounded-lg text-[10px] font-semibold text-muted-foreground">Request Swap</span>
          </div>
        </div>
      </div>
    ),
  },
]

export function CommunicationsShowcase() {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id)
  const current = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0]

  return (
    <section className="py-24 sm:py-32 relative bg-muted/30 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Multi-Channel Outreach</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Reach Every Member on the Channels They Actually Use.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Stop worrying about WhatsApp spam bans or emails getting lost in junk folders. Church Growth OS provides official verified delivery pipelines.
          </p>

          {/* Channel Selector Pills */}
          <div className="pt-6 flex items-center justify-center gap-2 flex-wrap">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              const isSelected = ch.id === activeChannel
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 scale-105'
                      : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{ch.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Channel Interactive Mockup */}
        <div className="mt-14 max-w-3xl mx-auto">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <current.icon className={`h-5 w-5 ${current.color}`} />
                <h3 className="font-display text-sm font-bold text-foreground">
                  {current.header}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {current.badge}
              </span>
            </div>

            {current.previewContent}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
