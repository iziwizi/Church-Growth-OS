import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin-sdk'

export interface AdminAuthResult {
  authorized: boolean
  user?: {
    uid: string
    email?: string
    role?: string
  }
  error?: string
}

/**
 * Validates whether the incoming request is authorized for Super Admin operations.
 *
 * SECURITY: this function must default-deny. It verifies a Firebase ID token
 * server-side via the Admin SDK, then requires either the `superAdmin`/`role`
 * custom claim on that verified token, or a `role: 'super_admin'` /
 * `isSuperAdmin: true` Firestore `users/{uid}` document as a fallback for
 * accounts whose claim hasn't propagated yet. There is no email-domain
 * shortcut and no "missing token" or "error" path that grants access —
 * every failure returns `authorized: false`.
 */
export async function verifySuperAdmin(req: NextRequest): Promise<AdminAuthResult> {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return { authorized: false, error: 'Missing Authorization header' }
    }

    const decoded = await adminAuth.verifyIdToken(token).catch((err: any) => {
      console.warn('[ADMIN_GUARD] Token verification failed:', err?.message)
      return null
    })
    if (!decoded) {
      return { authorized: false, error: 'Invalid or expired token' }
    }

    // Custom claims set via Admin SDK (adminAuth.setCustomUserClaims) are the
    // authoritative source — they cannot be forged by the client.
    if (decoded.superAdmin === true || decoded.role === 'super_admin') {
      return { authorized: true, user: { uid: decoded.uid, email: decoded.email, role: 'super_admin' } }
    }

    // Fallback: Firestore role document, for accounts granted the role
    // before their next token refresh picks up the custom claim.
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get().catch(() => null)
    if (userDoc?.exists && (userDoc.data()?.role === 'super_admin' || userDoc.data()?.isSuperAdmin === true)) {
      return { authorized: true, user: { uid: decoded.uid, email: decoded.email, role: 'super_admin' } }
    }

    return { authorized: false, error: 'User is not a Super Admin' }
  } catch (err: any) {
    console.error('[ADMIN_GUARD] Auth error:', err)
    return { authorized: false, error: 'Authorization check failed' }
  }
}
