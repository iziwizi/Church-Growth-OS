import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@mujteknify.com',
  password: 'AdminPassword2026!',
  role: 'super_admin' as const,
  fullName: 'MUJTEKNIFY Platform Super Admin',
}

/**
 * Ensures a Super Admin profile exists in Firestore.
 */
export async function ensureSuperAdminProfile(uid: string, email: string) {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.role !== 'super_admin') {
      await setDoc(
        ref,
        {
          uid,
          email,
          fullName: SUPER_ADMIN_CREDENTIALS.fullName,
          role: 'super_admin',
          churchId: null,
          emailVerified: true,
          status: 'active',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
  } catch (err) {
    console.warn('Super Admin profile check notice:', err)
  }
}
