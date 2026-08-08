'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Legacy /admin/infrastructure route — safely redirects to canonical /admin/ai-providers.
 * Eliminates duplicate configuration UI sources.
 */
export default function AdminInfrastructureRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/ai-providers')
  }, [router])

  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <p>Redirecting to AI Providers Configuration...</p>
      </div>
    </div>
  )
}
