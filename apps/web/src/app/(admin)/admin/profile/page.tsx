'use client'

import { useState } from 'react'
import {
  User,
  ShieldCheck,
  Lock,
  Loader2,
  Save,
  Mail,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldAlert,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { sendPasswordReset } from '@/lib/firebase/auth'
import { auth, db } from '@/lib/firebase/client'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'

export default function AdminProfilePage() {
  const { user } = useAuthStore()
  const [sendingReset, setSendingReset] = useState(false)

  // Change Email State
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const handleResetPassword = async () => {
    if (!user?.email) return
    setSendingReset(true)
    try {
      await sendPasswordReset(user.email)
      toast.success(`✓ Password reset email dispatched to ${user.email}! Check your inbox.`)
    } catch (err: any) {
      toast.error(`Failed to send password reset: ${err.message}`)
    } finally {
      setSendingReset(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentUser = auth.currentUser
    if (!currentUser || !currentUser.email) {
      toast.error('No authenticated session found.')
      return
    }

    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid new email address.')
      return
    }

    if (!currentPassword.trim()) {
      toast.error('Current password is required to authorize email change.')
      return
    }

    setUpdatingEmail(true)
    try {
      // 1. Re-authenticate user with current credentials
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // 2. Initiate email update
      if (typeof verifyBeforeUpdateEmail === 'function') {
        await verifyBeforeUpdateEmail(currentUser, newEmail.trim())
        toast.success(
          `✓ Verification link dispatched to ${newEmail}. Please click the link in your email to confirm the change.`
        )
      } else {
        await updateEmail(currentUser, newEmail.trim())
        toast.success(`✓ Super Admin email updated to ${newEmail}!`)
      }

      // 3. Update Firestore user document if present
      if (currentUser.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          email: newEmail.trim().toLowerCase(),
          updatedAt: serverTimestamp(),
        }).catch(() => null)
      }

      setShowEmailModal(false)
      setNewEmail('')
      setCurrentPassword('')
    } catch (err: any) {
      console.error('Change email error:', err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Incorrect password. Please verify your current password.')
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('This email address is already in use by another account.')
      } else if (err.code === 'auth/requires-recent-login') {
        toast.error('Session expired. Please log out and sign back in before changing your email.')
      } else {
        toast.error(`Email update error: ${err.message || 'Failed to update email'}`)
      }
    } finally {
      setUpdatingEmail(false)
    }
  }

  return (
    <div className="space-y-6 text-xs max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-brand-600" />
          Super Admin Profile &amp; Identity
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform operator identity, access credentials, and security controls for MUJTEKNIFY LIMITED.
        </p>
      </div>

      {/* Operator Account Overview */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-brand-600" />
            <h2 className="font-display text-base font-bold text-foreground">Operator Identity</h2>
          </div>
          <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-600 border border-brand-500/20">
            ROOT SUPER ADMINISTRATOR
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/10 p-3.5 space-y-1">
            <label className="font-semibold text-muted-foreground">Admin Account Email</label>
            <div className="flex items-center justify-between">
              <p className="font-mono font-bold text-foreground text-sm">
                {user?.email ?? 'mujteknify@gmail.com'}
              </p>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                Change Email
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-3.5 space-y-1">
            <label className="font-semibold text-muted-foreground">Security Role</label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-foreground">Super Admin (Unrestricted Master Access)</span>
            </div>
          </div>
        </div>

        {/* Security & Password Controls */}
        <div className="border-t pt-4 space-y-3">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">Authentication &amp; Password Management</h3>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Dispatch a cryptographically signed password reset link to your registered email address via Firebase Auth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={sendingReset}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs transition-colors"
            >
              {sendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Send Password Reset Link
            </button>

            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border bg-background px-4 font-semibold text-foreground hover:bg-accent shadow-xs transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Change Admin Email Address
            </button>
          </div>
        </div>

        {/* Platform Capabilities Summary */}
        <div className="border-t pt-4 space-y-2.5">
          <h3 className="font-display text-sm font-bold text-foreground">Operator System Privileges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Full multi-tenant database access across all churches</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>AgentRouter AI orchestration &amp; direct LLM key management</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Canonical pricing plan configuration &amp; coupon management</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Global feature flag override &amp; platform health diagnostics</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHANGE EMAIL MODAL ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-600" />
                Change Super Admin Email
              </h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangeEmail} className="space-y-3.5">
              <div>
                <label className="font-semibold text-muted-foreground">Current Email Address</label>
                <p className="font-mono font-medium text-foreground mt-0.5">{user?.email}</p>
              </div>

              <div>
                <label className="font-semibold text-foreground">New Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="newadmin@mujteknify.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Current Password (for Reauthentication) *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Required by Firebase Security Rules before updating root administrator credentials.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded-xl border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {updatingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Update Email Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
