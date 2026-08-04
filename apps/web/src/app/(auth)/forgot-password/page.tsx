'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Loader2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendPasswordReset, mapAuthError } from '@/lib/firebase/auth'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await sendPasswordReset(data.email)
      setSentEmail(data.email)
      setSubmitted(true)
      toast.success('Password reset link sent!')
    } catch (error) {
      toast.error(mapAuthError(error))
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Check your inbox</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;ve sent a password reset link to{' '}
          <span className="font-semibold text-foreground">{sentEmail}</span>.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
          <KeyRound className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="pastor@mychurch.org"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t text-center text-[11px] text-muted-foreground">
        Powered by <span className="font-semibold text-foreground">Church Growth OS</span> — A Product of{' '}
        <span className="font-semibold text-foreground">MUJTEKNIFY LIMITED</span>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <Suspense fallback={<div className="h-80 rounded-2xl border bg-card animate-pulse" />}>
        <ForgotPasswordForm />
      </Suspense>
    </motion.div>
  )
}
