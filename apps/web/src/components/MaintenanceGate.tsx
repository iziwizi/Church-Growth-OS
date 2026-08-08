'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuthStore } from '@/store'
import { Wrench } from 'lucide-react'

interface MaintenanceState {
  active: boolean
  message: string
}

/**
 * MaintenanceGate — Checks system/maintenance Firestore doc in real-time.
 * Super Admins bypass this gate entirely.
 * When maintenance is active, church admin users see a branded maintenance screen.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, user } = useAuthStore()
  const [maintenance, setMaintenance] = useState<MaintenanceState | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Super Admins always bypass maintenance mode
    if (isSuperAdmin) {
      setChecked(true)
      return
    }

    const unsub = onSnapshot(
      doc(db, 'system', 'maintenance'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setMaintenance({
            active: data.active ?? false,
            message: data.message ?? 'We\'re currently performing scheduled maintenance.',
          })
        } else {
          setMaintenance({ active: false, message: '' })
        }
        setChecked(true)
      },
      (err) => {
        console.warn('[MaintenanceGate] Could not read maintenance status:', err.message)
        // On error, allow access (fail open for availability)
        setMaintenance({ active: false, message: '' })
        setChecked(true)
      }
    )

    return () => unsub()
  }, [isSuperAdmin])

  // While checking, show nothing (AuthInitializer handles the loading screen)
  if (!checked) return <>{children}</>

  // Super admin always passes through
  if (isSuperAdmin) return <>{children}</>

  // Maintenance is active — show maintenance page
  if (maintenance?.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500">
              <Wrench className="h-10 w-10" />
            </div>
          </div>

          {/* Branding */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-bold text-brand-500">
              🔧 Scheduled Maintenance
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Church Growth OS
            </h1>
            <h2 className="text-lg font-semibold text-muted-foreground">
              We&apos;ll be right back
            </h2>
          </div>

          {/* Message */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {maintenance.message}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            {['🤖 AI Engine', '📊 Analytics', '📢 Communications'].map((f) => (
              <div key={f} className="rounded-xl border bg-card p-3 font-medium">
                {f}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-[11px] text-muted-foreground">
            For urgent support, contact{' '}
            <a href="mailto:support@mujteknify.com" className="font-semibold text-brand-500 hover:underline">
              support@mujteknify.com
            </a>
            {' '}— Powered by{' '}
            <span className="font-semibold text-foreground">MUJTEKNIFY LIMITED</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
