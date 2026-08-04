import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowLeft, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us — Church Growth OS',
  description: 'About Church Growth OS by MUJTEKNIFY LIMITED.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Church Growth OS" width={160} height={40} className="h-8 w-auto object-contain" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to App
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Ministry Operating System</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">About Church Growth OS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Intelligent automation for modern churches worldwide.</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed space-y-6">
          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">Our Vision</h2>
            <p>
              Church Growth OS empowers ministries to nurture members, track first-time visitors, automate follow-up workflows, and receive daily 6 AM executive insights without administrative bottleneck.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">Parent Organization</h2>
            <p>
              Church Growth OS is engineered and maintained by <strong>MUJTEKNIFY LIMITED</strong>, a leader in autonomous SaaS operating systems and cloud intelligence.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Church Growth OS — Powered by <span className="font-semibold text-foreground">MUJTEKNIFY LIMITED</span></p>
      </footer>
    </div>
  )
}
