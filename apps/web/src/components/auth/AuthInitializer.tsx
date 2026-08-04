'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
import { useAuthStore, useChurchStore } from '@/store'
import { Loader2 } from 'lucide-react'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password']

/**
 * AuthInitializer — Centralized Authentication & Production Route Guard.
 * Synchronizes Firebase Auth user with Firestore user profile and church data.
 * Enforces automatic redirects between /login, /setup, and /dashboard.
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

        // If user profile has churchId, fetch Church document
        let churchDoc = null
        if (activeChurchId) {
          churchDoc = await getUserChurch(firebaseUser.uid)
        } else {
          // Fallback check if church was created by ownerId
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
          superAdmin: false,
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
    const isSetup = pathname === '/setup'
    const hasChurch = !!church?.id

    if (!user) {
      if (!isPublic) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      } else {
        setCheckingRoute(false)
      }
      return
    }

    // User is authenticated
    if (!hasChurch) {
      if (!isSetup) {
        // Authenticated but no church -> Force automatic redirect to /setup
        router.replace('/setup')
      } else {
        setCheckingRoute(false)
      }
    } else {
      if (isSetup || isPublic) {
        // Authenticated with church setup complete -> Redirect to /dashboard
        router.replace('/dashboard')
      } else {
        setCheckingRoute(false)
      }
    }
  }, [user, church, isInitialized, pathname, router])

  // Loading Screen for uninitialized state or route transitions
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
