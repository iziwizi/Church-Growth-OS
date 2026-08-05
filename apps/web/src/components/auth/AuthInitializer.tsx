'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
import { ensureSuperAdminProfile } from '@/lib/auth/seedSuperAdmin'
import { useAuthStore, useChurchStore } from '@/store'
import { Loader2 } from 'lucide-react'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/privacy',
  '/terms',
  '/about',
  '/cookies',
]

// Admin routes — the admin login page must also be public
const ADMIN_PUBLIC_ROUTES = ['/admin/login']

/**
 * AuthInitializer — Centralized Authentication & Production Route Guard.
 * Enforces email verification gate, church onboarding redirect, and super admin access.
 * Super Admins are NEVER redirected to /setup or /verify-email.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingRoute, setCheckingRoute] = useState(true)

  const { user, isInitialized, setUser, setClaims, setLoading, setInitialized, reset } =
    useAuthStore()
  const { church, setChurch } = useChurchStore()

  // 1. Firebase Auth observer — syncs auth state + Firestore profile
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser)

          const isSuperAdminEmail = firebaseUser.email?.endsWith('@mujteknify.com') ?? false

          if (isSuperAdminEmail && firebaseUser.email) {
            await ensureSuperAdminProfile(firebaseUser.uid, firebaseUser.email).catch(() => null)
          }

          // Fetch Firestore profile
          const profile = await getUserProfile(firebaseUser.uid).catch(() => null)

          let activeChurchId = profile?.churchId ?? null
          let activeRole = profile?.role ?? (isSuperAdminEmail ? 'super_admin' : 'owner')
          const isSuperAdmin = isSuperAdminEmail || activeRole === 'super_admin'

          let churchDoc = null
          if (!isSuperAdmin) {
            // Only fetch church for non-super-admins
            if (activeChurchId) {
              churchDoc = await getUserChurch(firebaseUser.uid).catch(() => null)
            } else {
              churchDoc = await getUserChurch(firebaseUser.uid).catch(() => null)
              if (churchDoc) {
                activeChurchId = churchDoc.id
                activeRole = 'owner'
              }
            }
          }

          if (churchDoc) {
            setChurch(churchDoc)
          } else {
            setChurch(null)
          }

          setClaims({
            churchId: activeChurchId ?? '',
            role: activeRole,
            superAdmin: isSuperAdmin,
          })
        } else {
          reset()
          setChurch(null)
        }
      } catch (err) {
        console.error('AuthInitializer sync error:', err)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => unsubscribe()
  }, [setUser, setClaims, setLoading, setInitialized, reset, setChurch])

  // 2. Centralized Production Route Protection Guard
  useEffect(() => {
    if (!isInitialized) return

    const isPublic = PUBLIC_ROUTES.includes(pathname)
    const isAdminPublic = ADMIN_PUBLIC_ROUTES.includes(pathname)
    const isVerifyEmailPage = pathname === '/verify-email'
    const isSetup = pathname === '/setup'
    const isAdminRoute = pathname.startsWith('/admin')
    const hasChurch = !!church?.id

    // Determine if the current user is super admin
    const isSuperAdmin =
      user?.email?.endsWith('@mujteknify.com') || false

    // Admin login page — always accessible, no redirect
    if (isAdminPublic) {
      setCheckingRoute(false)
      return
    }

    // Case A: Unauthenticated
    if (!user) {
      if (isAdminRoute) {
        router.replace('/admin/login')
      } else if (!isPublic) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case B: Super Admin — bypass ALL onboarding checks
    if (isSuperAdmin) {
      // Super Admin should never land on setup or verify-email
      if (isSetup || isVerifyEmailPage) {
        router.replace('/admin')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case C: Church user — email not verified
    if (!user.emailVerified) {
      if (!isVerifyEmailPage) {
        router.replace('/verify-email')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case D: Email verified, sitting on /verify-email → go to setup
    if (isVerifyEmailPage) {
      router.replace(hasChurch ? '/dashboard' : '/setup')
      return
    }

    // Case E: Church user with no church setup → force /setup
    if (!hasChurch) {
      if (!isSetup && !isAdminRoute) {
        router.replace('/setup')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case F: Church user already set up, sitting on /setup → dashboard
    if (isSetup && hasChurch) {
      router.replace('/dashboard')
      return
    }

    // Case G: Authenticated church user on public pages → redirect to dashboard
    if (isPublic && pathname !== '/' && !isAdminRoute) {
      router.replace('/dashboard')
      return
    }

    setCheckingRoute(false)
  }, [user, church, isInitialized, pathname, router])

  // Show loading screen during auth initialization (not on public pages)
  const isAdminPublicPath = ADMIN_PUBLIC_ROUTES.includes(pathname)
  if (
    (!isInitialized || (checkingRoute && !PUBLIC_ROUTES.includes(pathname))) &&
    !isAdminPublicPath
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-muted-foreground">
            Authenticating Church Growth OS...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
