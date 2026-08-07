'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, RefreshCw, LogOut, ArrowRight, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { auth, resendVerification, logOut, mapAuthError } from '@/lib/firebase/auth'

function VerifyEmailForm() {
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)

  // Auto polling Firebase Auth status every 3 seconds
  useEffect(() => {
    console.log('[VERIFY_EMAIL_DEBUG] (app/(auth)/verify-email/page.tsx:18) Starting auto-polling interval for email verification status...')
    const interval = setInterval(async () => {
      if (!auth.currentUser) {
        console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:21) Polling tick: auth.currentUser is null')
        return
      }
      try {
        console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:25) Polling tick: calling auth.currentUser.reload() for uid:', auth.currentUser.uid)
        await auth.currentUser.reload()
        console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:27) Reload complete. emailVerified status:', auth.currentUser.emailVerified)

        if (auth.currentUser.emailVerified) {
          clearInterval(interval)
          console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:31) EMAIL IS VERIFIED! Calling router.replace(\'/setup\')...')
          toast.success('Email verified! Redirecting to setup...')
          router.replace('/setup')
        }
      } catch (err: any) {
        console.error('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:36) Auto reload polling error:')
        console.error('  code   :', err?.code)
        console.error('  message:', err?.message)
        console.error('  stack  :', err?.stack)
      }
    }, 3000)

    return () => {
      console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:44) Clearing auto-polling interval.')
      clearInterval(interval)
    }
  }, [router])

  const handleManualCheck = async () => {
    console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:49) Manual check requested...')
    setChecking(true)
    try {
      if (auth.currentUser) {
        console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:53) Reloading auth.currentUser...')
        await auth.currentUser.reload()
        console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:55) emailVerified:', auth.currentUser.emailVerified)
        if (auth.currentUser.emailVerified) {
          toast.success('Email verified!')
          console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:58) Calling router.replace(\'/setup\')...')
          router.replace('/setup')
          return
        }
      }
      toast.info('Email not verified yet. Please check your inbox or spam folder.')
    } catch (err: any) {
      console.error('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:65) Manual check error:')
      console.error('  code   :', err?.code)
      console.error('  message:', err?.message)
      console.error('  stack  :', err?.stack)
      toast.error('Failed to refresh status.')
    } finally {
      setChecking(false)
    }
  }

  const handleResend = async () => {
    console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:75) Resend button clicked...')
    setResending(true)
    try {
      console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:78) Calling resendVerification()...')
      await resendVerification()
      console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:80) resendVerification() SUCCESS!')
      toast.success('Verification email sent! Check your inbox and spam folder.')
    } catch (err: any) {
      console.error('====================================================')
      console.error('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:84) RESEND VERIFICATION EXCEPTION!')
      console.error('  Error  :', err)
      console.error('  Code   :', err?.code)
      console.error('  Message:', err?.message)
      console.error('  Stack  :', err?.stack)
      console.error('====================================================')
      toast.error(mapAuthError(err))
    } finally {
      setResending(false)
    }
  }

  const handleSignOut = async () => {
    console.log('[VERIFY_EMAIL_DEBUG] (verify-email/page.tsx:97) Use another email clicked -> signing out...')
    await logOut()
    router.replace('/login')
  }

  const userEmail = auth.currentUser?.email ?? 'your email'

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm text-center space-y-6">
      {/* Brand Icon / Illustration */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
        <Mail className="h-10 w-10 text-brand-500" />
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Account Created Successfully</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Check your inbox</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a verification link to{' '}
          <span className="font-semibold text-foreground">{userEmail}</span>.
          Please click the verification link to proceed to Church Setup.
        </p>
      </div>

      {/* Main Actions */}
      <div className="space-y-3 pt-2">
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs"
        >
          <span>Open Gmail</span>
          <ExternalLink className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={checking}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-50"
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
          <span>Resend Verification</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Use another email</span>
        </button>
      </div>

      {/* Product Attribution */}
      <div className="pt-2 border-t text-[11px] text-muted-foreground">
        Powered by <span className="font-semibold text-foreground">Church Growth OS</span> — A Product of{' '}
        <a href="https://mujteknify.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">
          MUJTEKNIFY LIMITED
        </a>
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
