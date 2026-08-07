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
 *
 * FULLY INSTRUMENTED FOR ROUTE GUARD DEBUGGING.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingRoute, setCheckingRoute] = useState(true)

  const { user, isSuperAdmin: storeIsSuperAdmin, role, isInitialized, setUser, setClaims, setLoading, setInitialized, reset } =
    useAuthStore()
  const { church, setChurch } = useChurchStore()

  // 1. Firebase Auth observer — syncs auth state + Firestore profile
  useEffect(() => {
    console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:41) Subscribing to onAuthChange listener...')
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:43) onAuthChange fired!')
      console.log('  firebaseUser:', firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, emailVerified: firebaseUser.emailVerified } : null)
      try {
        if (firebaseUser) {
          setUser(firebaseUser)

          const isSuperAdminEmail = firebaseUser.email?.endsWith('@mujteknify.com') ?? false
          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:48) isSuperAdminEmail:', isSuperAdminEmail)

          if (isSuperAdminEmail && firebaseUser.email) {
            console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:51) Ensuring Super Admin profile for:', firebaseUser.email)
            await ensureSuperAdminProfile(firebaseUser.uid, firebaseUser.email).catch((seedErr) => {
              console.error('[AUTH_INITIALIZER_DEBUG] ensureSuperAdminProfile error:', seedErr)
              return null
            })
          }

          // Fetch Firestore profile
          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:58) Fetching user profile from Firestore...')
          const profile = await getUserProfile(firebaseUser.uid).catch((profErr) => {
            console.error('[AUTH_INITIALIZER_DEBUG] getUserProfile error:', profErr)
            return null
          })
          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:63) Firestore profile fetched:', profile)

          let activeChurchId = profile?.churchId ?? null
          let activeRole = profile?.role ?? (isSuperAdminEmail ? 'super_admin' : 'owner')
          const isSuperAdmin = isSuperAdminEmail || activeRole === 'super_admin'

          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:69) Computed sync state:', { activeChurchId, activeRole, isSuperAdmin })

          let churchDoc = null
          if (!isSuperAdmin) {
            console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:73) Non-super-admin user. Fetching church doc...')
            churchDoc = await getUserChurch(firebaseUser.uid).catch((chErr) => {
              console.error('[AUTH_INITIALIZER_DEBUG] getUserChurch error:', chErr)
              return null
            })
            if (churchDoc) {
              activeChurchId = churchDoc.id
              activeRole = 'owner'
              console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:81) Found church doc:', churchDoc.id)
            }
          }

          if (churchDoc) {
            setChurch(churchDoc)
          } else {
            setChurch(null)
          }

          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:91) Calling setClaims:', { churchId: activeChurchId ?? '', role: activeRole, superAdmin: isSuperAdmin })
          setClaims({
            churchId: activeChurchId ?? '',
            role: activeRole,
            superAdmin: isSuperAdmin,
          })
        } else {
          console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:98) No Firebase user — calling reset() and setChurch(null)')
          reset()
          setChurch(null)
        }
      } catch (err: any) {
        console.error('====================================================')
        console.error('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:104) EXCEPTION IN ONAUTHCHANGE!')
        console.error('  Error  :', err)
        console.error('  Code   :', err?.code)
        console.error('  Message:', err?.message)
        console.error('  Stack  :', err?.stack)
        console.error('====================================================')
      } finally {
        setLoading(false)
        setInitialized(true)
        console.log('[AUTH_INITIALIZER_DEBUG] (AuthInitializer.tsx:114) Auth initialization cycle complete. isInitialized set to true.')
      }
    })

    return () => unsubscribe()
  }, [setUser, setClaims, setLoading, setInitialized, reset, setChurch])

  // 2. Centralized Production Route Protection Guard
  useEffect(() => {
    console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:123) Route guard evaluated!')
    console.log('  Pathname           :', pathname)
    console.log('  isInitialized      :', isInitialized)
    console.log('  user               :', user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : null)
    console.log('  storeIsSuperAdmin  :', storeIsSuperAdmin)
    console.log('  role               :', role)
    console.log('  church             :', church ? church.id : null)

    if (!isInitialized) {
      console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:132) Waiting for auth store initialization...')
      return
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname)
    const isAdminPublic = ADMIN_PUBLIC_ROUTES.includes(pathname)
    const isVerifyEmailPage = pathname === '/verify-email'
    const isSetup = pathname === '/setup'
    const isAdminRoute = pathname.startsWith('/admin')
    const hasChurch = !!church?.id

    // Determine if the current user is super admin
    const isSuperAdmin =
      storeIsSuperAdmin ||
      role === 'super_admin' ||
      user?.email?.endsWith('@mujteknify.com') ||
      false

    console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:149) Evaluated guard flags:', {
      isPublic,
      isAdminPublic,
      isVerifyEmailPage,
      isSetup,
      isAdminRoute,
      hasChurch,
      isSuperAdmin,
    })

    // Admin login page — always accessible, no redirect
    if (isAdminPublic) {
      console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:160) Path is /admin/login — allowing access.')
      setCheckingRoute(false)
      return
    }

    // Case A: Unauthenticated
    if (!user) {
      if (isAdminRoute) {
        console.error('====================================================')
        console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 169')
        console.error('  Case   : Case A (Unauthenticated on Admin route)')
        console.error('  Path   :', pathname)
        console.error('  Target :', '/admin/login')
        console.error('====================================================')
        router.replace('/admin/login')
      } else if (!isPublic) {
        const target = `/login?from=${encodeURIComponent(pathname)}`
        console.error('====================================================')
        console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 178')
        console.error('  Case   : Case A (Unauthenticated on Private route)')
        console.error('  Path   :', pathname)
        console.error('  Target :', target)
        console.error('====================================================')
        router.replace(target)
      } else {
        console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:184) Unauthenticated on Public route — allowing access.')
        setCheckingRoute(false)
      }
      return
    }

    // Case B: Super Admin — bypass ALL onboarding checks
    if (isSuperAdmin) {
      console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:191) User is Super Admin.')
      if (isSetup || isVerifyEmailPage) {
        console.error('====================================================')
        console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 194')
        console.error('  Case   : Case B (Super Admin on setup/verify-email)')
        console.error('  Path   :', pathname)
        console.error('  Target :', '/admin')
        console.error('====================================================')
        router.replace('/admin')
      } else {
        console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:201) Super Admin on valid route (' + pathname + ') — allowing access.')
        setCheckingRoute(false)
      }
      return
    }

    // Case C: Church user — email not verified
    if (!user.emailVerified) {
      console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:208) Church user email NOT verified.')
      if (!isVerifyEmailPage) {
        console.error('====================================================')
        console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 211')
        console.error('  Case   : Case C (Unverified email)')
        console.error('  Path   :', pathname)
        console.error('  Target :', '/verify-email')
        console.error('====================================================')
        router.replace('/verify-email')
      } else {
        console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:218) Unverified user on /verify-email — allowing access.')
        setCheckingRoute(false)
      }
      return
    }

    // Case D: Email verified, sitting on /verify-email → go to setup
    if (isVerifyEmailPage) {
      const target = hasChurch ? '/dashboard' : '/setup'
      console.error('====================================================')
      console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 226')
      console.error('  Case   : Case D (Verified email sitting on /verify-email)')
      console.error('  Path   :', pathname)
      console.error('  Target :', target)
      console.error('====================================================')
      router.replace(target)
      return
    }

    // Case E: Church user with no church setup → force /setup
    if (!hasChurch) {
      if (!isSetup && !isAdminRoute) {
        console.error('====================================================')
        console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 237')
        console.error('  Case   : Case E (No church setup)')
        console.error('  Path   :', pathname)
        console.error('  Target :', '/setup')
        console.error('====================================================')
        router.replace('/setup')
      } else {
        console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:244) User with no church on /setup or /admin — allowing access.')
        setCheckingRoute(false)
      }
      return
    }

    // Case F: Church user already set up, sitting on /setup → dashboard
    if (isSetup && hasChurch) {
      console.error('====================================================')
      console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 252')
      console.error('  Case   : Case F (Already set up, sitting on /setup)')
      console.error('  Path   :', pathname)
      console.error('  Target :', '/dashboard')
      console.error('====================================================')
      router.replace('/dashboard')
      return
    }

    // Case G: Authenticated church user on public pages → redirect to dashboard
    if (isPublic && pathname !== '/' && !isAdminRoute) {
      console.error('====================================================')
      console.error('[ROUTE_GUARD_REDIRECT] REDIRECTED BY: AuthInitializer.tsx line 263')
      console.error('  Case   : Case G (Authenticated user on public route ' + pathname + ')')
      console.error('  Target :', '/dashboard')
      console.error('====================================================')
      router.replace('/dashboard')
      return
    }

    console.log('[ROUTE_GUARD_DEBUG] (AuthInitializer.tsx:270) Route guard PASSED for pathname:', pathname)
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
