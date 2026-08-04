'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, RefreshCw, LogOut, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { auth, resendVerification, logOut } from '@/lib/firebase/auth'

function VerifyEmailForm() {
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)

  // Continuously check emailVerified status
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!auth.currentUser) return
      try {
        await auth.currentUser.reload()
        if (auth.currentUser.emailVerified) {
          clearInterval(interval)
          toast.success('Email verified! Redirecting to setup...')
          router.replace('/setup')
        }
      } catch (err) {
        console.warn('Error checking email verification:', err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload()
        if (auth.currentUser.emailVerified) {
          toast.success('Email verified!')
          router.replace('/setup')
          return
        }
      }
      toast.info('Email not verified yet. Please check your inbox or spam folder.')
    } catch {
      toast.error('Failed to reload auth status.')
    } finally {
      setChecking(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const sent = await resendVerification()
      if (sent) {
        toast.success('Verification email re-sent! Check your inbox.')
      } else {
        toast.error('Could not resend email. Please try again in a few moments.')
      }
    } catch {
      toast.error('Error resending email.')
    } finally {
      setResending(false)
    }
  }

  const handleSignOut = async () => {
    await logOut()
    router.replace('/login')
  }

  const userEmail = auth.currentUser?.email ?? 'your email'

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm text-center space-y-6">
      {/* Icon Badge */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
        <Mail className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Account Created</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Verify your email address</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a verification link to{' '}
          <span className="font-semibold text-foreground">{userEmail}</span>.
          Please click the link in your email to unlock your account setup.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 pt-2">
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs"
        >
          <span>Open Gmail</span>
          <ExternalLink className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={checking}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin text-brand-500" /> : <ArrowRight className="h-4 w-4 text-brand-500" />}
          <span>I&apos;ve verified my email</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between border-t pt-4 text-xs">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-1.5 font-medium text-brand-500 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
          <span>Resend Email</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <Suspense fallback={<div className="h-96 rounded-2xl border bg-card animate-pulse" />}>
        <VerifyEmailForm />
      </Suspense>
    </motion.div>
  )
}
