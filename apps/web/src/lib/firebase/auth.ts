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
  type ActionCodeSettings,
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
        return 'Firebase recently sent a verification email to this address. Please wait 1-2 minutes before trying again or check your inbox/spam folder.'
      case 'auth/unauthorized-continue-uri':
      case 'auth/invalid-continue-uri':
        return 'Could not process redirect URL. A standard verification email has been requested instead.'
      case 'auth/user-disabled':
        return 'This account has been disabled by a system administrator.'
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection and try again.'
      case 'auth/requires-recent-login':
        return 'Please sign out and sign back in to perform this sensitive action.'
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
  // 1. Create Firebase Authentication account
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // 2. Set display name
  try {
    await updateProfile(user, { displayName: fullName })
  } catch (profileErr) {
    console.warn('Could not update profile displayName:', profileErr)
  }

  // 3. Create Firestore User Profile Document in /users/{uid}
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

  // 4. Send Email Verification with domain-safe fallback
  let verificationSent = false
  try {
    const appUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    const actionCodeSettings: ActionCodeSettings = {
      url: `${appUrl}/verify-email`,
      handleCodeInApp: false,
    }
    try {
      await sendEmailVerification(user, actionCodeSettings)
      verificationSent = true
    } catch (actionErr: any) {
      console.warn('sendEmailVerification with custom actionCodeSettings failed:', actionErr?.code, actionErr?.message)
      // Retry basic sendEmailVerification ONLY if error was related to invalid/unauthorized URI
      if (actionErr?.code === 'auth/unauthorized-continue-uri' || actionErr?.code === 'auth/invalid-continue-uri') {
        await sendEmailVerification(user)
        verificationSent = true
      } else if (actionErr?.code === 'auth/too-many-requests') {
        // Initial email was already sent or rate-limited by Firebase
        verificationSent = true
      } else {
        // Fallback basic send
        await sendEmailVerification(user)
        verificationSent = true
      }
    }
  } catch (emailErr) {
    console.error('Failed to send verification email during signup:', emailErr)
  }

  return { user, verificationSent }
}

export async function signInUser(email: string, password: string): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // Update lastLogin timestamp and emailVerified in Firestore
  try {
    const userDocRef = doc(db, 'users', user.uid)
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    })
  } catch {
    // If profile document missing, create it
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
    } catch (setErr) {
      console.warn('Could not sync user profile on login:', setErr)
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
  } catch (err) {
    console.error('Error fetching user profile:', err)
    return null
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

export async function resendVerification(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No user is currently signed in. Please sign in to request a verification email.')
  }
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  const actionCodeSettings: ActionCodeSettings = {
    url: `${appUrl}/verify-email`,
    handleCodeInApp: false,
  }

  try {
    await sendEmailVerification(user, actionCodeSettings)
  } catch (actionErr: any) {
    console.warn('resendVerification with actionCodeSettings failed:', actionErr?.code, actionErr?.message)
    // If rate limited by Firebase, re-throw so the UI displays user-friendly cooldown warning
    if (actionErr?.code === 'auth/too-many-requests') {
      throw actionErr
    }
    // For URI or other config errors, fallback to basic sendEmailVerification
    await sendEmailVerification(user)
  }

  return true
}

export async function logOut(): Promise<void> {
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
