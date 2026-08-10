import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin-sdk'

export interface AuthenticatedUserResult {
  authorized: boolean
  uid?: string
  email?: string
  churchId?: string | null
  role?: string
  error?: string
}

/**
 * Verifies the request carries a valid Firebase ID token and resolves the
 * caller's churchId/role (from custom claims first, Firestore `users/{uid}`
 * as fallback). Use this on any tenant-scoped API route that currently
 * trusts a client-supplied `churchId`/`userId` — it replaces that trust
 * with a server-verified identity. Default-deny: any failure returns
 * `authorized: false`.
 */
export async function verifyAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUserResult> {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    if (!token) {
      return { authorized: false, error: 'Missing Authorization header' }
    }

    const decoded = await adminAuth.verifyIdToken(token).catch((err: any) => {
      console.warn('[AUTH_GUARD] Token verification failed:', err?.message)
      return null
    })
    if (!decoded) {
      return { authorized: false, error: 'Invalid or expired token' }
    }

    let churchId = (decoded.churchId as string | undefined) ?? null
    let role = (decoded.role as string | undefined) ?? undefined
    const isSuper = decoded.superAdmin === true || decoded.role === 'super_admin'

    if (!isSuper && (!churchId || !role)) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get().catch(() => null)
      if (userDoc?.exists) {
        const data = userDoc.data() || {}
        churchId = churchId ?? data.churchId ?? null
        role = role ?? data.role
      }
    }

    return {
      authorized: true,
      uid: decoded.uid,
      email: decoded.email,
      churchId: isSuper ? churchId : churchId ?? null,
      role: isSuper ? 'super_admin' : role,
    }
  } catch (err: any) {
    console.error('[AUTH_GUARD] Error:', err)
    return { authorized: false, error: 'Authorization check failed' }
  }
}
