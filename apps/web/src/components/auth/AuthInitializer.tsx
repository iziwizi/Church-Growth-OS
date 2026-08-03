'use client'

import { useEffect } from 'react'
import { onAuthChange, getIdTokenResult } from '@/lib/firebase/auth'
import { useAuthStore, useChurchStore } from '@/store'

/**
 * AuthInitializer — attaches Firebase auth state observer.
 * Must be rendered inside the providers tree.
 * Populates the auth store with user + custom claims.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setClaims, setLoading, setInitialized, reset } = useAuthStore()
  const { setChurch } = useChurchStore()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setUser(user)

        // Extract custom claims from token
        const tokenResult = await getIdTokenResult()
        if (tokenResult?.claims?.churchId) {
          setClaims({
            churchId: tokenResult.claims['churchId'] as string,
            role: tokenResult.claims['role'] as Parameters<typeof setClaims>[0]['role'],
            superAdmin: tokenResult.claims['superAdmin'] as boolean | undefined,
          })
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

  return <>{children}</>
}
