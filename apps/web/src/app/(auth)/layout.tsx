import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Users, UserCheck, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Church Growth OS — Authentication',
  description: 'Sign in or register for your Church Growth OS account',
}

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Automation',
    desc: 'Autonomous engagement workflows that run 24/7',
  },
  {
    icon: Users,
    title: 'Unified Member Engine',
    desc: 'Single-source-of-truth congregation database',
  },
  {
    icon: UserCheck,
    title: 'Visitor Follow-up',
    desc: 'Automated 7-step guest retention pipeline',
  },
  {
    icon: FileText,
    title: 'Executive AI Reports',
    desc: 'Daily 6 AM automated executive summary',
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-12 bg-background text-foreground">
      {/* ── LEFT SIDE: Premium Hero Section (Desktop Only) ──────────────── */}
      <div className="relative hidden lg:col-span-6 lg:flex flex-col justify-between p-12 bg-card border-r border-border overflow-hidden">
        {/* Ambient Gradient Background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={240}
              height={64}
              className="h-14 w-auto object-contain rounded-lg"
              priority
            />
          </Link>
        </div>

        {/* Hero Content */}
        <div className="my-auto max-w-lg space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-400">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Production SaaS Platform</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
            Grow your church with{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              intelligent automation.
            </span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage members, automate follow-ups, communicate effectively, and gain actionable ministry insights from one unified operating system.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {FEATURES.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background/50 p-4 backdrop-blur-sm shadow-xs space-y-1.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-8 border-t border-border/40">
          <p>&copy; {new Date().getFullYear()} Church Growth OS</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Authentication Form (Mobile & Desktop) ────────────── */}
      <div className="flex lg:col-span-6 flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Header Logo — larger, perfectly centered, one logo only */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={240}
              height={64}
              className="h-16 w-auto object-contain rounded-lg"
              priority
            />
          </Link>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
