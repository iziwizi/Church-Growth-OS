'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
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

/**
 * AuthInitializer — Centralized Authentication & Production Route Guard.
 * Enforces email verification gate, church onboarding redirect, and super admin access.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingRoute, setCheckingRoute] = useState(true)

  const { user, isInitialized, setUser, setClaims, setLoading, setInitialized, reset } =
    useAuthStore()
  const { church, setChurch } = useChurchStore()

  // 1. Observer for Firebase Auth & Firestore synchronization
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Fetch User Profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid)

        let activeChurchId = profile?.churchId ?? null
        let activeRole = profile?.role ?? 'owner'

        // Check if user is Super Admin (either profile role === 'super_admin' or claims)
        const isSuperAdmin = activeRole === 'super_admin' || profile?.email?.endsWith('@mujteknify.com')

        let churchDoc = null
        if (activeChurchId) {
          churchDoc = await getUserChurch(firebaseUser.uid)
        } else {
          churchDoc = await getUserChurch(firebaseUser.uid)
          if (churchDoc) {
            activeChurchId = churchDoc.id
            activeRole = 'owner'
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

      setLoading(false)
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [setUser, setClaims, setLoading, setInitialized, reset, setChurch])

  // 2. Centralized Production Route Protection Guard
  useEffect(() => {
    if (!isInitialized) return

    const isPublic = PUBLIC_ROUTES.includes(pathname)
    const isVerifyEmailPage = pathname === '/verify-email'
    const isSetup = pathname === '/setup'
    const isAdminRoute = pathname.startsWith('/admin')
    const hasChurch = !!church?.id

    // Case A: Unauthenticated User
    if (!user) {
      if (!isPublic) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case B: Authenticated User BUT Email NOT Verified
    if (!user.emailVerified) {
      if (!isVerifyEmailPage) {
        router.replace('/verify-email')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case C: Authenticated User AND Email Verified, sitting on /verify-email
    if (isVerifyEmailPage) {
      if (!hasChurch) {
        router.replace('/setup')
      } else {
        router.replace('/dashboard')
      }
      return
    }

    // Case D: User without Church Setup completed
    if (!hasChurch) {
      if (!isSetup && !isAdminRoute) {
        router.replace('/setup')
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // Case E: Authenticated User with Church Setup completed
    if (isSetup || (isPublic && pathname !== '/' && !isAdminRoute)) {
      router.replace('/dashboard')
    } else {
      setCheckingRoute(false)
    }
  }, [user, church, isInitialized, pathname, router])

  // Loading Screen
  if (!isInitialized || (checkingRoute && !PUBLIC_ROUTES.includes(pathname))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-muted-foreground">Authenticating Church Growth OS...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
