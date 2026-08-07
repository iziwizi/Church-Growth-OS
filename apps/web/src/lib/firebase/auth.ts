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
): Promise<{ user: User; verificationSent: boolean }> {
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

  // 4. Send Email Verification via server-side API route
  let verificationSent = false
  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Calling /api/auth/send-verification endpoint...')
  try {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, fullName }),
    })

    console.log('[AUTH_DEBUG] /api/auth/send-verification response status:', res.status)
    const data = await res.json()
    console.log('[AUTH_DEBUG] /api/auth/send-verification response body:', data)

    if (res.ok && data.success) {
      verificationSent = true
      console.log('[AUTH_DEBUG] Verification email sent successfully via Resend. MessageID:', data.messageId)
    } else {
      console.error('[AUTH_DEBUG] /api/auth/send-verification API returned error:', data.error)
      // Fallback: try Firebase built-in
      try {
        console.log('[AUTH_DEBUG] Attempting Firebase fallback sendEmailVerification(user)...')
        await sendEmailVerification(user)
        verificationSent = true
        console.log('[AUTH_DEBUG] Fallback sendEmailVerification SUCCESS!')
      } catch (fbErr: any) {
        console.error('[AUTH_DEBUG] Fallback sendEmailVerification FAILED!')
        console.error('  code   :', fbErr?.code)
        console.error('  message:', fbErr?.message)
        console.error('  stack  :', fbErr?.stack)
      }
    }
  } catch (fetchErr: any) {
    console.error('[AUTH_DEBUG] Could not reach /api/auth/send-verification API route!')
    console.error('  error  :', fetchErr)
    console.error('  message:', fetchErr?.message)
    console.error('  stack  :', fetchErr?.stack)
    // Fallback: try Firebase built-in
    try {
      console.log('[AUTH_DEBUG] Attempting Firebase fallback sendEmailVerification(user)...')
      await sendEmailVerification(user)
      verificationSent = true
      console.log('[AUTH_DEBUG] Fallback sendEmailVerification SUCCESS!')
    } catch (fbErr: any) {
      console.error('[AUTH_DEBUG] Fallback sendEmailVerification FAILED!')
      console.error('  code   :', fbErr?.code)
      console.error('  message:', fbErr?.message)
      console.error('  stack  :', fbErr?.stack)
    }
  }

  console.log('[AUTH_DEBUG] (lib/firebase/auth.ts:signUpUser) Completed. Returning { user, verificationSent:', verificationSent, '}')
  return { user, verificationSent }
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

export async function resendVerification(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) {
    console.error('[AUTH_DEBUG] (resendVerification) No authenticated user in auth.currentUser')
    throw new Error('No user is currently signed in. Please sign in to request a verification email.')
  }

  if (!user.email) {
    throw new Error('No email address associated with this account.')
  }

  console.log('[AUTH_DEBUG] (resendVerification) Resending verification for user:', user.email, 'uid:', user.uid)

  try {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        fullName: user.displayName ?? 'Pastor',
      }),
    })
    console.log('[AUTH_DEBUG] (resendVerification) API status:', res.status)
    const data = await res.json()
    console.log('[AUTH_DEBUG] (resendVerification) API data:', data)

    if (res.ok && data.success) {
      console.log('[AUTH_DEBUG] (resendVerification) Resend verification email SUCCESS! MessageID:', data.messageId)
      return true
    }

    console.error('[AUTH_DEBUG] (resendVerification) Resend API returned error, trying fallback:', data.error)
    await sendEmailVerification(user)
    console.log('[AUTH_DEBUG] (resendVerification) Fallback sendEmailVerification SUCCESS.')
    return true
  } catch (err: any) {
    console.error('[AUTH_DEBUG] (resendVerification) Resend error:', err?.code, err?.message, err?.stack)
    try {
      await sendEmailVerification(user)
      console.log('[AUTH_DEBUG] (resendVerification) Fallback sendEmailVerification SUCCESS.')
      return true
    } catch (fbErr: any) {
      console.error('[AUTH_DEBUG] (resendVerification) Firebase fallback error:', fbErr?.code, fbErr?.message, fbErr?.stack)
      throw fbErr
    }
  }
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
