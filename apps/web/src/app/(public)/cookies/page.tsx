import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Cookie, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy — Church Growth OS',
  description: 'Cookie Policy for Church Growth OS by MUJTEKNIFY LIMITED.',
}

export default function CookiesPage() {
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
            <Cookie className="h-3.5 w-3.5" />
            <span>Cookie & Session Policy</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: January 1, 2026</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed space-y-6">
          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground">Strictly Necessary Cookies</h2>
            <p>
              Church Growth OS uses secure local session tokens via Firebase Authentication to keep church administrators logged in safely. No advertising or tracking cookies are utilized.
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
