import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, Lock, Globe, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — Church Growth OS',
  description: 'Privacy Policy and data protection commitment for Church Growth OS.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Church Growth OS" width={160} height={40} className="h-8 w-auto object-contain" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: January 1, 2026 • Version 2.0 Production</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed space-y-6">
          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">1. Introduction</h2>
            <p>
              Church Growth OS (&quot;the Platform&quot;), operated by <strong>MUJTEKNIFY LIMITED</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), respects your privacy and is committed to protecting the personal data of churches, ministers, members, and visitors using our platform.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">2. Data We Collect</h2>
            <p>We collect information necessary to provide church operating system services, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Church profile information (Name, Slug, Logo, Address, Contact details)</li>
              <li>User authentication credentials via Firebase Authentication</li>
              <li>Congregation data entered by church staff (Members, Visitors, Prayer Requests, Giving)</li>
              <li>Communication delivery logs (WhatsApp, Email, SMS metadata)</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">3. Security & Cloud Infrastructure</h2>
            <p>
              All church data is stored using enterprise-grade encrypted database isolation (Google Firebase Firestore & Cloud Storage). Data in transit is secured via TLS 1.3 encryption.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">4. Contact & Compliance</h2>
            <p>
              For privacy inquiries or data removal requests, contact our compliance team at <strong>privacy@mujteknify.com</strong>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Church Growth OS — Powered by <span className="font-semibold text-foreground">MUJTEKNIFY LIMITED</span></p>
      </footer>
    </div>
  )
}
