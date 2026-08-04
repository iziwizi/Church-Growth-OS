'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile } from '@/lib/firebase/auth'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'
import { useAuthStore, useChurchStore } from '@/store'
import { Loader2 } from 'lucide-react'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password']

/**
 * AuthInitializer — Attaches Firebase auth observer & enforces production route protection.
 * Loads user profile and church data from Firestore into client stores.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isInitialized, setUser, setClaims, setLoading, setInitialized, reset } =
    useAuthStore()
  const { setChurch } = useChurchStore()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Fetch user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid)
        if (profile) {
          setClaims({
            churchId: profile.churchId ?? '',
            role: profile.role ?? 'owner',
            superAdmin: false,
          })

          // If user has a churchId in profile, load the church doc
          if (profile.churchId) {
            const churchDoc = await getUserChurch(firebaseUser.uid)
            if (churchDoc) {
              setChurch(churchDoc)
            }
          }
        } else {
          // If user doc doesn't exist yet, check by ownerId in churches
          const churchDoc = await getUserChurch(firebaseUser.uid)
          if (churchDoc) {
            setChurch(churchDoc)
            setClaims({
              churchId: churchDoc.id,
              role: 'owner',
              superAdmin: false,
            })
          }
        }
      } else {
        reset()
        setChurch(null)
      }

      setLoading(false)
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [setUser, setClaims, setLoading, setInitialized, reset, setChurch])

  // Guard routing logic after initialization
  useEffect(() => {
    if (!isInitialized || isLoading) return

    const isPublic = PUBLIC_ROUTES.includes(pathname)
    const isSetup = pathname === '/setup'

    if (!user && !isPublic) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`)
      return
    }

    if (user) {
      // Check if user has an associated church
      getUserChurch(user.uid).then((churchDoc) => {
        const hasChurch = !!churchDoc

        if (isPublic) {
          // Logged in user visiting login/register -> redirect to dashboard or setup
          router.push(hasChurch ? '/dashboard' : '/setup')
        } else if (!hasChurch && !isSetup) {
          // Authenticated but no church setup complete -> force redirect to setup
          router.push('/setup')
        } else if (hasChurch && isSetup) {
          // Church setup already completed -> redirect away from setup to dashboard
          router.push('/dashboard')
        }
      })
    }
  }, [user, isInitialized, isLoading, pathname, router])

  if (isLoading && !PUBLIC_ROUTES.includes(pathname)) {
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
