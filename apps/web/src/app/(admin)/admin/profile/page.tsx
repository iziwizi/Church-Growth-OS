'use client'

import { useState } from 'react'
import { User, ShieldCheck, Lock, Loader2, Save } from 'lucide-react'
import { useAuthStore } from '@/store'
import { sendPasswordReset } from '@/lib/firebase/auth'
import { toast } from 'sonner'

export default function AdminProfilePage() {
  const { user } = useAuthStore()
  const [sending, setSending] = useState(false)

  const handleResetPassword = async () => {
    if (!user?.email) return
    setSending(true)
    try {
      await sendPasswordReset(user.email)
      toast.success(`Password reset email sent to ${user.email}!`)
    } catch {
      toast.error('Failed to send password reset email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Super Admin Profile
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform operator identity and credentials for MUJTEKNIFY LIMITED.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-brand-500" />
          Operator Account Details
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-semibold text-muted-foreground">Admin Email</label>
            <p className="font-mono font-bold text-foreground text-sm mt-0.5">{user?.email ?? 'admin@mujteknify.com'}</p>
          </div>
          <div>
            <label className="font-semibold text-muted-foreground">Role</label>
            <div className="mt-0.5">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-500 border border-brand-500/20">
                Super Administrator
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="font-bold text-foreground">Password &amp; Security</p>
          <p className="text-muted-foreground">Send a secure password reset link to your registered admin email.</p>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={sending}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Send Password Reset Link
          </button>
        </div>
      </div>
    </div>
  )
}
