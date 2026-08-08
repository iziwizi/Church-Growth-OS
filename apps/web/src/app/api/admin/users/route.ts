import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/users - Lists all platform users across all tenants
 * PATCH /api/admin/users - Updates a user's role or status
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const snap = await adminDb.collection('users').get()
    const users: any[] = []

    snap.docs.forEach((d: any) => {
      const data = d.data()
      users.push({
        id: d.id,
        fullName: data.fullName ?? 'Church User',
        email: data.email ?? 'no-email',
        role: data.role ?? 'owner',
        churchId: data.churchId ?? null,
        emailVerified: data.emailVerified ?? false,
        status: data.status ?? 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      })
    })

    return NextResponse.json({ success: true, users })
  } catch (err: any) {
    console.error('[API_ADMIN_USERS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, role, status } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (role !== undefined) {
      updatePayload.role = role
      // Also update custom claims in Firebase Auth
      await adminAuth.setCustomUserClaims(userId, {
        role,
        superAdmin: role === 'super_admin',
      }).catch((claimErr: any) => console.warn('[API_ADMIN_USERS] Custom claims update warning:', claimErr))
    }

    if (status !== undefined) {
      updatePayload.status = status
    }

    await adminDb.collection('users').doc(userId).update(updatePayload)

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_USERS] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update user' }, { status: 500 })
  }
}
