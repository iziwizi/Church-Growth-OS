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

  // 4. Send Email Verification with domain-safe fallback & explicit logging
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
      console.log('[Registration] Sending email verification with ActionCodeSettings:', actionCodeSettings.url)
      await sendEmailVerification(user, actionCodeSettings)
      verificationSent = true
      console.log('[Registration] Email verification sent successfully with ActionCodeSettings.')
    } catch (actionErr: any) {
      console.error('[Registration Email Error] Code:', actionErr?.code, 'Message:', actionErr?.message)
      try {
        console.log('[Registration] Falling back to basic sendEmailVerification...')
        await sendEmailVerification(user)
        verificationSent = true
        console.log('[Registration] Basic email verification sent successfully.')
      } catch (basicErr: any) {
        console.error('[Registration Email Fallback Error] Code:', basicErr?.code, 'Message:', basicErr?.message)
      }
    }
  } catch (emailErr: any) {
    console.error('[Registration Email Outer Error] Code:', emailErr?.code, 'Message:', emailErr?.message)
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
    console.error('[Resend Verification Error] Code: auth/no-user Message: No user is currently signed in.')
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
    console.log('[Resend Verification] Attempting send with ActionCodeSettings:', actionCodeSettings.url)
    await sendEmailVerification(user, actionCodeSettings)
    console.log('[Resend Verification] Email sent successfully with ActionCodeSettings.')
  } catch (actionErr: any) {
    console.error('[Resend Verification Error] Code:', actionErr?.code, 'Message:', actionErr?.message)
    if (actionErr?.code === 'auth/too-many-requests') {
      throw actionErr
    }
    try {
      console.log('[Resend Verification] Falling back to basic sendEmailVerification...')
      await sendEmailVerification(user)
      console.log('[Resend Verification] Basic email sent successfully.')
    } catch (fallbackErr: any) {
      console.error('[Resend Verification Fallback Error] Code:', fallbackErr?.code, 'Message:', fallbackErr?.message)
      throw fallbackErr
    }
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
