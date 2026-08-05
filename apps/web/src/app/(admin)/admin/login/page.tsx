'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShieldCheck, Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required.')
      return
    }
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const uid = credential.user.uid

      // Verify Super Admin role in Firestore
      const userSnap = await getDoc(doc(db, 'users', uid))
      const userData = userSnap.data()

      const isSuperAdmin =
        userData?.role === 'super_admin' ||
        credential.user.email?.endsWith('@mujteknify.com')

      if (!isSuperAdmin) {
        await auth.signOut()
        toast.error(
          'Access denied. This portal is restricted to MUJTEKNIFY platform administrators.'
        )
        setLoading(false)
        return
      }

      toast.success('Welcome, Super Admin!')
      router.replace('/admin')
    } catch (err: any) {
      const code = err?.code ?? ''
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        toast.error('Invalid credentials. Please check your email and password.')
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.')
      } else {
        toast.error(err?.message ?? 'Authentication failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={140}
              height={36}
              className="h-10 w-auto object-contain rounded-lg"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Super Admin Portal</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Platform Access</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Restricted to MUJTEKNIFY LIMITED administrators only.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border bg-card p-8 shadow-sm space-y-4"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-semibold text-foreground">
              Administrator Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="admin@mujteknify.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? 'Authenticating...' : 'Access Admin Portal'}
          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Not an administrator?{' '}
          <a href="/login" className="font-semibold text-brand-600 hover:underline">
            Church sign-in →
          </a>
        </p>

        <p className="text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} MUJTEKNIFY LIMITED. All rights reserved.
        </p>
      </div>
    </div>
  )
}
