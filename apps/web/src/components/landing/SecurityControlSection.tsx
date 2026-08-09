'use client'

import {
  ShieldCheck,
  Lock,
  Server,
  UserCheck,
  KeyRound,
  FileCheck,
} from 'lucide-react'

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: 'Isolated Multi-Tenant Architecture',
    desc: 'Every church tenant has strictly isolated data records in Firebase Firestore. Member records and giving details are never cross-accessible.',
  },
  {
    icon: UserCheck,
    title: '13-Module Role Permission Matrix',
    desc: 'Customize granular View/Create/Edit/Delete permissions for Pastors, Finance Officers, Media Teams, and Volunteers.',
  },
  {
    icon: ShieldCheck,
    title: 'Human Approval Safety Queues',
    desc: 'AI automations never run rogue. Enable Manual Mode to require explicit leader authorization before messages or workflows dispatch.',
  },
  {
    icon: KeyRound,
    title: 'Server-Side Secret Management',
    desc: 'API keys for WhatsApp, Resend, and Payment Gateways remain securely encrypted server-side and are never exposed to browser clients.',
  },
]

export function SecurityControlSection() {
  return (
    <section className="py-20 sm:py-28 bg-muted/10 border-y border-border/50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Ministry Trust &amp; Privacy</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Your Congregation's Data. Completely Protected.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We take spiritual stewardship and privacy seriously. Strict tenant isolation, granular staff permissions, and server-side encryption keep your ministry safe.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {SECURITY_POINTS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-xs hover:border-emerald-500/40 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
