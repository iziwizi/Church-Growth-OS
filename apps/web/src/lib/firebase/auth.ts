import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { auth, db } from './client'

export interface UserProfileData {
  uid: string
  fullName: string
  email: string
  photoURL: string | null
  createdAt: unknown
  updatedAt: unknown
  role: 'super_admin' | 'owner' | 'admin' | 'pastor' | 'staff'
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled'
  churchId: string | null
  emailVerified: boolean
  lastLogin: unknown
  status: 'active' | 'suspended' | 'pending'
}

export type VerificationSendStatus = 'sent' | 'already_verified' | 'rate_limited' | 'fallback_sent' | 'failed'

export interface VerificationSendResult {
  status: VerificationSendStatus
  message: string
  retryAfterSeconds?: number
}

/**
 * Requests a verification email via the primary (Resend/Admin SDK) route,
 * falling back to Firebase's own client-side mailer only for genuine
 * provider/config failures — never for rate limiting, so a confused user
 * clicking resend repeatedly gets one clear "please wait Ns" message
 * instead of silently cascading into Firebase's own per-user cooldown
 * (which previously surfaced as a generic, unexplained "too many requests").
 */
async function requestVerificationEmail(email: string, fullName?: string): Promise<VerificationSendResult> {
  try {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    })
    const data = await res.json().catch(() => ({}) as any)

    if (res.ok && data.status === 'sent') {
      return { status: 'sent', message: data.message ?? 'Verification email sent — please check your inbox.' }
    }
    if (data.status === 'already_verified') {
      return { status: 'already_verified', message: 'This email address is already verified.' }
    }
    if (data.status === 'rate_limited') {
      return {
        status: 'rate_limited',
        message: data.error ?? 'Please wait before requesting another verification email.',
        retryAfterSeconds: data.retryAfterSeconds,
      }
    }
    // config_error / provider_error / anything unexpected: last-resort fallback.
    return attemptFirebaseFallback()
  } catch {
    return attemptFirebaseFallback()
  }
}

async function attemptFirebaseFallback(): Promise<VerificationSendResult> {
  const user = auth.currentUser
  if (!user) {
    return { status: 'failed', message: 'No signed-in user to send a verification email to.' }
  }
  try {
    await sendEmailVerification(user)
    return { status: 'fallback_sent', message: 'Verification email sent via backup provider — please check your inbox.' }
  } catch (err: any) {
    if (err?.code === 'auth/too-many-requests') {
      return { status: 'rate_limited', message: 'Too many requests. Please wait a few minutes before trying again.' }
    }
    return { status: 'failed', message: mapAuthError(err) }
  }
}

export function mapAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.'
      case 'auth/weak-password':
        return 'Password should be at least 8 characters long and contain a mix of characters.'
      case 'auth/too-many-requests':
        return 'Too many requests. Please wait 1-2 minutes before trying again.'
      case 'auth/user-disabled':
        return 'This account has been disabled by a system administrator.'
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection and try again.'
      default:
        return (error as { message?: string }).message ?? 'An unexpected authentication error occurred.'
    }
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export async function signUpUser(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: User; verification: VerificationSendResult }> {
  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Registration started for email:', email)

  // 1. Create Firebase Authentication account
  let credential: UserCredential
  try {
    credential = await createUserWithEmailAndPassword(auth, email, password)
    console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Firebase createUserWithEmailAndPassword SUCCESS!')
    console.log('[AUTH_DEBUG]   UID          :', credential.user.uid)
    console.log('[AUTH_DEBUG]   Email        :', credential.user.email)
    console.log('[AUTH_DEBUG]   emailVerified:', credential.user.emailVerified)
  } catch (createErr: any) {
    console.error('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Firebase createUserWithEmailAndPassword FAILED!')
    console.error('  code   :', createErr?.code)
    console.error('  message:', createErr?.message)
    console.error('  stack  :', createErr?.stack)
    throw createErr
  }

  const user = credential.user

  // 2. Set display name
  try {
    await updateProfile(user, { displayName: fullName })
    console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Display name updated to:', fullName)
  } catch (profileErr: any) {
    console.error('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Could not update displayName:', profileErr?.code, profileErr?.message, profileErr?.stack)
  }

  // 3. Create Firestore User Profile Document
  try {
    const userDocRef = doc(db, 'users', user.uid)
    const profilePayload: UserProfileData = {
      uid: user.uid,
      fullName,
      email: user.email ?? email,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'owner',
      subscriptionStatus: 'trial',
      churchId: null,
      emailVerified: user.emailVerified,
      lastLogin: serverTimestamp(),
      status: 'active',
    }
    await setDoc(userDocRef, profilePayload)
    console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Firestore user profile doc setDoc SUCCESS!')
  } catch (docErr: any) {
    console.error('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Firestore setDoc user profile FAILED!')
    console.error('  code   :', docErr?.code)
    console.error('  message:', docErr?.message)
    console.error('  stack  :', docErr?.stack)
  }

  // 4. Send Email Verification via server-side API route (with a controlled
  // fallback — see requestVerificationEmail for why this no longer retries
  // blindly into Firebase's own rate limiter).
  const verification = await requestVerificationEmail(user.email ?? email, fullName)
  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Verification result:', verification)

  return { user, verification }
}

export async function signInUser(email: string, password: string): Promise<UserCredential> {
  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) signInUser started for:', email)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = credential.user

  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) signInWithEmailAndPassword SUCCESS!')
  console.log('[AUTH_DEBUG]   UID          :', user.uid)
  console.log('[AUTH_DEBUG]   Email        :', user.email)
  console.log('[AUTH_DEBUG]   emailVerified:', user.emailVerified)

  // Update lastLogin timestamp and emailVerified in Firestore
  try {
    const userDocRef = doc(db, 'users', user.uid)
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    })
    console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) User profile updated with lastLogin.')
  } catch (updateErr: any) {
    console.warn('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) Profile updateDoc warning:', updateErr?.code, updateErr?.message, updateErr?.stack)
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(userDocRef, {
        uid: user.uid,
        fullName: user.displayName ?? 'Pastor',
        email: user.email ?? email,
        photoURL: user.photoURL ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'owner',
        subscriptionStatus: 'trial',
        churchId: null,
        emailVerified: user.emailVerified,
        lastLogin: serverTimestamp(),
        status: 'active',
      }, { merge: true })
      console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) User profile fallback setDoc SUCCESS.')
    } catch (setErr: any) {
      console.error('[AUTH_DEBUG] (lib/firebase/auth.ts:signInUser) Could not sync profile on login:', setErr?.code, setErr?.message, setErr?.stack)
    }
  }

  return credential
}

export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      return snap.data() as UserProfileData
    }
    return null
  } catch (err: any) {
    console.error('[AUTH_DEBUG] (lib/firebase/auth.ts:getUserProfile) Error fetching user profile:', err?.code, err?.message, err?.stack)
    return null
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

export async function resendVerification(): Promise<VerificationSendResult> {
  const user = auth.currentUser
  if (!user?.email) {
    return { status: 'failed', message: 'No user is currently signed in. Please sign in to request a verification email.' }
  }

  console.log('[AUTH_DEBUG] (resendVerification) Resending verification for user:', user.email, 'uid:', user.uid)
  return requestVerificationEmail(user.email, user.displayName ?? 'Pastor')
}

export async function logOut(): Promise<void> {
  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:logOut) Signing out user...')
  return signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken(forceRefresh)
}

export async function getIdTokenResult(forceRefresh = false) {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdTokenResult(forceRefresh)
}

export { auth }
