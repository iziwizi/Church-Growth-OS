'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { signInUser, mapAuthError } from '@/lib/firebase/auth'
import { loginSchema } from '@church-growth-os/shared'
import type { z } from 'zod'

type LoginFormData = z.infer<typeof loginSchema>

/**
 * LoginForm — Phase 3 Fix: Login Double-Submission Bug
 *
 * Root cause: The old code called `router.replace('/dashboard')` immediately
 * after signIn, AND the AuthInitializer was also trying to redirect via
 * onAuthStateChanged. Two concurrent redirects created a race condition where
 * the form could reappear.
 *
 * Fix: After signIn succeeds, show a persistent "Redirecting..." state and
 * do NOT manually call router.replace(). The AuthInitializer handles all
 * routing via its centralized Route Guard after onAuthStateChanged fires and
 * fully hydrates both the user profile AND the church profile. This eliminates
 * the race between the login page's manual redirect and the auth observer.
 */
function LoginForm() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const submittedRef = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // Prevent double submission
    if (submittedRef.current) return
    submittedRef.current = true

    try {
      await signInUser(data.email, data.password)
      toast.success('Welcome back! Redirecting...')

      // ✅ KEY FIX: Do NOT call router.replace() here.
      // AuthInitializer will handle the redirect via onAuthStateChanged after
      // it fully hydrates the user profile and church document. Calling
      // router.replace() here races with the auth observer and causes the
      // login form to reappear on the second render cycle.
      //
      // Instead, show a persistent "redirecting" state so the user sees
      // feedback. The AuthInitializer loading screen will take over
      // as soon as the auth state is confirmed.
      setRedirecting(true)

    } catch (error) {
      submittedRef.current = false
      toast.error(mapAuthError(error))
    }
  }

  // While waiting for AuthInitializer to kick in and redirect
  if (redirecting) {
    return (
      <div className="rounded-2xl border bg-card p-8 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[280px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <div className="text-center">
          <p className="font-semibold text-foreground">Signing you in...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Loading your church dashboard. Please wait.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to your Church Growth OS account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="pastor@mychurch.org"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || redirecting}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white ring-offset-background transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">New to Church Growth OS?</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Register link */}
      <Link
        href="/register"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Create your church account
      </Link>

      <div className="pt-4 border-t text-center text-[11px] text-muted-foreground">
        Powered by <span className="font-semibold text-foreground">Church Growth OS</span> — A Product of{' '}
        <a href="https://mujteknify.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">
          MUJTEKNIFY LIMITED
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-2xl border bg-card p-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </motion.div>
  )
}
