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

const ADMIN_PUBLIC_ROUTES = ['/admin/login']

/**
 * AuthInitializer — Centralized Authentication & Production Route Guard.
 * Strictly separates Super Admin routing from Church Tenant onboarding.
 * Super Admins are NEVER redirected to /setup or /verify-email.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingRoute, setCheckingRoute] = useState(true)

  const {
    user,
    isSuperAdmin: storeIsSuperAdmin,
    role,
    isInitialized,
    setUser,
    setClaims,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  const { church, setChurch } = useChurchStore()

  // 1. Firebase Auth observer — syncs auth state + Firestore profile
  useEffect(() => {
    console.log('[AUTH_INIT] Subscribing to onAuthChange...')
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[AUTH_INIT] onAuthChange event fired. User:', firebaseUser?.email ?? 'null')
      try {
        if (firebaseUser) {
          setUser(firebaseUser)

          const isSuperAdminEmail = firebaseUser.email?.endsWith('@mujteknify.com') ?? false

          if (isSuperAdminEmail && firebaseUser.email) {
            await ensureSuperAdminProfile(firebaseUser.uid, firebaseUser.email).catch((e) =>
              console.warn('[AUTH_INIT] ensureSuperAdminProfile notice:', e?.message)
            )
          }

          // Fetch Firestore profile
          const profile = await getUserProfile(firebaseUser.uid).catch((e) => {
            console.warn('[AUTH_INIT] getUserProfile notice:', e?.message)
            return null
          })

          let activeChurchId = profile?.churchId ?? null
          let activeRole = profile?.role ?? (isSuperAdminEmail ? 'super_admin' : 'owner')
          const isSuperAdmin = isSuperAdminEmail || activeRole === 'super_admin'

          let churchDoc = null
          if (!isSuperAdmin) {
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
      } catch (err: any) {
        console.error('[AUTH_INIT] Exception in onAuthChange:', err?.message, err?.stack)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => unsubscribe()
  }, [setUser, setClaims, setLoading, setInitialized, reset, setChurch])

  // 2. Centralized Production Route Protection Guard
  useEffect(() => {
    if (!isInitialized) {
      console.log('[ROUTE_GUARD] Auth not initialized yet. Delaying route guard evaluation.')
      return
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname)
    const isAdminPublic = ADMIN_PUBLIC_ROUTES.includes(pathname)
    const isVerifyEmailPage = pathname === '/verify-email'
    const isSetup = pathname === '/setup'
    const isAdminRoute = pathname.startsWith('/admin')
    const hasChurch = !!church?.id

    const isSuperAdmin =
      storeIsSuperAdmin ||
      role === 'super_admin' ||
      user?.email?.endsWith('@mujteknify.com') ||
      false

    console.log('[ROUTE_GUARD] Evaluating route:', {
      pathname,
      user: user?.email,
      isSuperAdmin,
      role,
      hasChurch,
      isInitialized,
    })

    // Case A: Super Admin Users — Independent Routing
    if (isSuperAdmin) {
      if (isAdminPublic) {
        console.log('[ROUTE_GUARD] Authenticated Super Admin on /admin/login → Redirecting to /admin')
        router.replace('/admin')
        return
      }
      if (isSetup || isVerifyEmailPage) {
        console.log('[ROUTE_GUARD] Super Admin on setup/verify-email → Redirecting to /admin')
        router.replace('/admin')
        return
      }
      setCheckingRoute(false)
      return
    }

    // Case B: Admin Login Page for Non-Admins / Unauthenticated
    if (isAdminPublic) {
      setCheckingRoute(false)
      return
    }

    // Case C: Unauthenticated Users
    if (!user) {
      if (isAdminRoute) {
        console.log('[ROUTE_GUARD] Unauthenticated on /admin/* → Redirecting to /admin/login')
        router.replace('/admin/login')
      } else if (!isPublic) {
        console.log('[ROUTE_GUARD] Unauthenticated on private route → Redirecting to /login')
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case D: Church Users — Email Verification Gate
    if (!user.emailVerified) {
      if (!isVerifyEmailPage) {
        console.log('[ROUTE_GUARD] Unverified email → Redirecting to /verify-email')
        router.replace('/verify-email')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case E: Email Verified Sitting on /verify-email → Proceed to Setup or Dashboard
    if (isVerifyEmailPage) {
      const target = hasChurch ? '/dashboard' : '/setup'
      console.log('[ROUTE_GUARD] Verified email sitting on /verify-email → Redirecting to', target)
      router.replace(target)
      return
    }

    // Case F: Church Users — Onboarding Setup Gate
    if (!hasChurch) {
      if (!isSetup && !isAdminRoute) {
        console.log('[ROUTE_GUARD] No church setup completed → Redirecting to /setup')
        router.replace('/setup')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case G: Church Users Already Set Up Sitting on /setup → Redirect to Dashboard
    if (isSetup && hasChurch) {
      console.log('[ROUTE_GUARD] Church user already set up sitting on /setup → Redirecting to /dashboard')
      router.replace('/dashboard')
      return
    }

    // Case H: Authenticated Church Users on Public Auth Pages → Redirect to Dashboard
    if (isPublic && pathname !== '/' && !isAdminRoute) {
      console.log('[ROUTE_GUARD] Authenticated user on public auth page → Redirecting to /dashboard')
      router.replace('/dashboard')
      return
    }

    setCheckingRoute(false)
  }, [user, church, isInitialized, pathname, router, storeIsSuperAdmin, role])

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
