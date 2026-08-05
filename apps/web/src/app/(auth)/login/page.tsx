'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { signInUser, mapAuthError } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
import { loginSchema } from '@church-growth-os/shared'
import type { z } from 'zod'

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const cred = await signInUser(data.email, data.password)
      toast.success('Welcome back!')

      // Check church setup immediately and redirect
      const church = await getUserChurch(cred.user.uid)
      if (!church) {
        toast.info('Please complete your church setup.')
        router.replace('/setup')
      } else {
        const from = searchParams.get('from') ?? '/dashboard'
        router.replace(from)
      }
    } catch (error) {
      toast.error(mapAuthError(error))
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      {/* Header with Centered Rounded Logo */}
      <div className="mb-6 text-center space-y-3">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Church Growth OS"
            className="h-12 w-auto object-contain rounded-lg shadow-2xs border bg-background p-1"
          />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sign in to your Church Growth OS account
          </p>
        </div>
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
          disabled={isSubmitting}
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
