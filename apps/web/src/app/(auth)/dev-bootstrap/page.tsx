'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Church, CheckCircle2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { seedDevAccountAndChurch, DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD } from '@/lib/auth/seedDevAccount'
import { useAuthStore, useChurchStore } from '@/store'
import { getUserChurch } from '@/lib/auth/checkChurchSetup'

export default function DevBootstrapPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { setUser } = useAuthStore()
  const { setChurch } = useChurchStore()

  const handleSeedAndLogin = async () => {
    setLoading(true)
    try {
      const { uid } = await seedDevAccountAndChurch()
      const church = await getUserChurch(uid)

      if (church) {
        setChurch(church)
      }

      setDone(true)
      toast.success('Development environment seeded successfully!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bootstrap failed'
      toast.error(`Dev bootstrap error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 mb-3">
            Development Mode Only
          </span>
          <h1 className="font-display text-2xl font-bold text-white">Dev Bootstrap & Auto-Seed</h1>
          <p className="mt-2 text-sm text-slate-400">
            Instantly seed the development Owner account and demo church dataset.
          </p>
        </div>

        <div className="my-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-2">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Email:</span>
            <span className="font-mono font-semibold text-indigo-300">{DEV_ADMIN_EMAIL}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Password:</span>
            <span className="font-mono font-semibold text-indigo-300">{DEV_ADMIN_PASSWORD}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Default Church:</span>
            <span className="font-semibold text-emerald-400">Grace Fellowship Church</span>
          </div>
        </div>

        <button
          onClick={handleSeedAndLogin}
          disabled={loading || done}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Seeding Auth & Firestore...
            </>
          ) : done ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Redirecting to Dashboard...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Seed Dev Data & Sign In
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Or{' '}
          <a href="/login" className="text-indigo-400 hover:underline">
            return to standard login
          </a>
        </p>
      </motion.div>
    </div>
  )
}
