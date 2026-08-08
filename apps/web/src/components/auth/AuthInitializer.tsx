'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile, logOut } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
import { ensureSuperAdminProfile } from '@/lib/auth/seedSuperAdmin'
import { useAuthStore, useChurchStore } from '@/store'
import { Loader2, AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

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
 * AuthInitializer — Production-Grade Auth Lifecycle & Route Guard.
 * Guarantees bounded initialization (never stuck in infinite loading).
 * Completely separates Super Admin routing from Church Tenant onboarding.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingRoute, setCheckingRoute] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // 1. Firebase Auth Observer with Bounded Timeout & Auto-Recovery
  useEffect(() => {
    console.log('[AUTH_INIT] Initializing auth observer...')

    // Bounded safety fallback: guarantee isInitialized becomes true within 8s
    initTimeoutRef.current = setTimeout(() => {
      console.warn('[AUTH_INIT] Safety timeout reached (8s). Forcing initialization.')
      setLoading(false)
      setInitialized(true)
    }, 8000)

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[AUTH_INIT] Auth state changed. User:', firebaseUser?.email ?? 'Unauthenticated')
      setInitError(null)

      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          const isSuperAdminEmail = firebaseUser.email?.endsWith('@mujteknify.com') ?? false

          // Handle Super Admin
          if (isSuperAdminEmail && firebaseUser.email) {
            await ensureSuperAdminProfile(firebaseUser.uid, firebaseUser.email).catch((e) =>
              console.warn('[AUTH_INIT] Super Admin profile notice:', e?.message)
            )
          }

          // Fetch user profile from Firestore
          let profile = await getUserProfile(firebaseUser.uid).catch((e) => {
            console.warn('[AUTH_INIT] getUserProfile notice:', e?.message)
            return null
          })

          // Issue 9 Fix: Recover missing user profile if auth user exists but /users/{uid} is missing
          if (!profile && !isSuperAdminEmail) {
            console.log('[AUTH_INIT] Missing profile for authenticated user. Recovering default profile...')
            try {
              const fallbackProfile = {
                uid: firebaseUser.uid,
                fullName: firebaseUser.displayName ?? 'Church Leader',
                email: firebaseUser.email ?? '',
                photoURL: firebaseUser.photoURL ?? null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                role: 'owner' as const,
                subscriptionStatus: 'trial' as const,
                churchId: null,
                emailVerified: firebaseUser.emailVerified,
                lastLogin: serverTimestamp(),
                status: 'active' as const,
              }
              await setDoc(doc(db, 'users', firebaseUser.uid), fallbackProfile, { merge: true })
              profile = fallbackProfile as any
            } catch (recoveryErr) {
              console.error('[AUTH_INIT] Could not create fallback profile:', recoveryErr)
            }
          }

          let activeChurchId = profile?.churchId ?? null
          let activeRole = profile?.role ?? (isSuperAdminEmail ? 'super_admin' : 'owner')
          const isSuperAdmin = isSuperAdminEmail || activeRole === 'super_admin'

          let churchDoc = null

          // Issue 7 Fix: Super Admin NEVER looks up church document
          if (!isSuperAdmin) {
            // First try direct lookup by profile.churchId if available
            if (activeChurchId) {
              try {
                const directSnap = await getDoc(doc(db, 'churches', activeChurchId))
                if (directSnap.exists()) {
                  churchDoc = { id: directSnap.id, ...directSnap.data() } as any
                }
              } catch (err) {
                console.warn('[AUTH_INIT] Direct church lookup by ID failed, falling back to owner query:', err)
              }
            }

            // Fallback: Query church where ownerId == uid
            if (!churchDoc) {
              churchDoc = await getUserChurch(firebaseUser.uid).catch((err) => {
                console.warn('[AUTH_INIT] getUserChurch error:', err)
                return null
              })
            }

            if (churchDoc) {
              activeChurchId = churchDoc.id
              activeRole = activeRole ?? 'owner'
            }
          }

          if (churchDoc) {
            setChurch(churchDoc as any)
          } else if (!activeChurchId) {
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
        console.error('[AUTH_INIT] Auth observer exception:', err)
        setInitError(err?.message ?? 'Failed to complete authentication sequence.')
      } finally {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current)
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current)
      unsubscribe()
    }
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
    const isDashboard = pathname === '/dashboard'

    const isSuperAdmin =
      storeIsSuperAdmin ||
      role === 'super_admin' ||
      user?.email?.endsWith('@mujteknify.com') ||
      false

    // Case A: Super Admin Routing (Issue 7 Fix: Independent of church document)
    if (isSuperAdmin) {
      if (isAdminPublic || isSetup || isVerifyEmailPage) {
        console.log('[ROUTE_GUARD] Super Admin on auth/setup page → Redirecting to /admin')
        router.replace('/admin')
        return
      }
      setCheckingRoute(false)
      return
    }

    // Case B: Public Admin Login
    if (isAdminPublic) {
      setCheckingRoute(false)
      return
    }

    // Case C: Unauthenticated Users
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

    // Case D: Unverified Email Gate
    if (!user.emailVerified) {
      if (!isVerifyEmailPage) {
        router.replace('/verify-email')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case E: Verified Email sitting on /verify-email
    if (isVerifyEmailPage) {
      const target = hasChurch ? '/dashboard' : '/setup'
      router.replace(target)
      return
    }

    // Case F: Church Users — Setup Gate
    if (!hasChurch) {
      if (!isSetup && !isAdminRoute && !isDashboard) {
        router.replace('/setup')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case G: Set up Church Users sitting on /setup → Redirect to Dashboard
    if (isSetup && hasChurch) {
      router.replace('/dashboard')
      return
    }

    // Case H: Authenticated Church Users on Public Auth Pages → Redirect to Dashboard
    if (isPublic && pathname !== '/' && !isAdminRoute) {
      router.replace('/dashboard')
      return
    }

    setCheckingRoute(false)
  }, [user, church, isInitialized, pathname, router, storeIsSuperAdmin, role])

  // Error State: Prevent Infinite Loading
  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="rounded-2xl border bg-card p-8 shadow-sm max-w-md space-y-4">
          <div className="flex justify-center text-amber-500">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">Authentication Warning</h2>
          <p className="text-xs text-muted-foreground">{initError}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
            <button
              onClick={() => logOut().then(() => window.location.href = '/login')}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input bg-background px-4 text-xs font-semibold hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading Screen
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
