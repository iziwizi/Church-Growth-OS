'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  CheckCheck,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

const CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Meta Cloud',
    icon: MessageSquare,
    badge: 'High Open Rate',
    desc: 'Official WhatsApp Business Cloud API for 1-to-1 welcome chats, service reminders, and prayer circle updates with zero number bans.',
    sample: 'Dear Sister Sarah, thank you for worshipping at Grace City today! Pastor would love to share this week\'s study notes with you.',
  },
  {
    id: 'email',
    name: 'Resend Verified Email',
    icon: Mail,
    badge: 'Deliverability Engine',
    desc: 'Custom-domain DKIM/SPF verified transactional email for weekly pastoral letters, giving receipts, and service bulletins.',
    sample: 'Grace City Weekly Bulletin: Sunday Message Summary, Midweek Life Groups, and upcoming Youth Camp Registration.',
  },
  {
    id: 'sms',
    name: 'Direct SMS Gateway',
    icon: Smartphone,
    badge: 'Instant Reach',
    desc: 'Dedicated SMS sender ID for instant prayer alerts, emergency schedule updates, and urgent ministry notices.',
    sample: 'GraceCity: Reminder! Special Miracle Service starts today at 6:00 PM. Join us in-person or live at churchgrowthos.com/live',
  },
  {
    id: 'inapp',
    name: 'In-App & Worker Alerts',
    icon: Bell,
    badge: 'Internal Synergy',
    desc: 'Targeted notifications for department leaders, ushering teams, intercessors, and pastoral staff.',
    sample: 'New Visitor Assigned: Brother John Davis has been routed to the Welcome Department for 24h follow-up.',
  },
]

export function CommunicationsShowcase() {
  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const current = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0]

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-y border-border/50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Multi-Channel Outreach</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Reach Your Congregation Wherever They Are.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Send targeted broadcasts across WhatsApp, Email, SMS, and in-app notifications. Combine channels or let members choose their preferred contact method.
          </p>
        </div>

        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Channel Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              const isSelected = ch.id === activeChannel
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-brand-500/60 bg-card shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/20'
                      : 'border-border/60 bg-background/50 hover:bg-card hover:border-border'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground truncate">{ch.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
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

          {/* Live Preview Box */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <current.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{current.name}</h4>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5" /> High Deliverability Guaranteed
                    </span>
                  </div>
                </div>

                <span className="text-xs px-3 py-1 rounded-xl bg-muted text-muted-foreground font-semibold">
                  Preview
                </span>
              </div>

              {/* Message Bubble simulation */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>To: <strong>All First-Time Visitors (Sunday Service)</strong></span>
                  <span>10:45 AM</span>
                </div>
                <div className="rounded-xl bg-background border border-border/50 p-4 text-xs sm:text-sm text-foreground leading-relaxed shadow-2xs font-normal">
                  {current.sample}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>Sender: Grace City Cathedral</span>
                  <span className="text-emerald-500 font-semibold">✓ Delivered • Verified Pipeline</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Audience Segmentation</p>
                  <p className="font-bold text-foreground mt-0.5">Departments, Visitors, Leaders</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Compliance &amp; Opt-outs</p>
                  <p className="font-bold text-foreground mt-0.5">Automated Stop Handling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
