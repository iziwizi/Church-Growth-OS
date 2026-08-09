import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'
import { DEFAULT_FEATURE_FLAGS } from '@/lib/server/feature-flags'

/**
 * GET /api/admin/feature-flags
 * Returns the canonical global feature flags document from system/featureFlags.
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    if (!adminDb) {
      return NextResponse.json({ success: true, flags: DEFAULT_FEATURE_FLAGS, source: 'offline_default' })
    }

    const docSnap = await adminDb.collection('system').doc('featureFlags').get()
    if (docSnap.exists) {
      const data = docSnap.data()!
      // Filter out metadata and return clean boolean flags
      const flags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS }
      Object.keys(data).forEach((key) => {
        if (key !== 'updatedAt' && key !== 'updatedBy' && typeof data[key] === 'boolean') {
          flags[key] = data[key]
        }
      })
      return NextResponse.json({ success: true, flags, source: 'firestore_canonical' })
    }

    // Initialize document if not yet present
    await adminDb.collection('system').doc('featureFlags').set({
      ...DEFAULT_FEATURE_FLAGS,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true, flags: DEFAULT_FEATURE_FLAGS, source: 'initialized' })
  } catch (err: any) {
    console.error('[API_ADMIN_FEATURE_FLAGS] GET error:', err)
    return NextResponse.json({ success: true, flags: DEFAULT_FEATURE_FLAGS, error: err?.message })
  }
}

/**
 * PATCH /api/admin/feature-flags
 * Body: { key: string, value: boolean } or { flags: Record<string, boolean> }
 * Authenticated Super Admin endpoint to update feature flags in Firestore.
 */
export async function PATCH(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: authCheck.user?.email || 'super_admin',
    }

    if (body.key && typeof body.value === 'boolean') {
      updatePayload[body.key] = body.value
    } else if (body.flags && typeof body.flags === 'object') {
      Object.entries(body.flags).forEach(([k, v]) => {
        if (typeof v === 'boolean') {
          updatePayload[k] = v
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid payload. Provide { key, value } or { flags }.' }, { status: 400 })
    }

    await adminDb.collection('system').doc('featureFlags').set(updatePayload, { merge: true })

    // Return the updated flags
    const updatedSnap = await adminDb.collection('system').doc('featureFlags').get()
    const currentData = updatedSnap.data() || {}
    const cleanFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS }
    Object.keys(currentData).forEach((key) => {
      if (key !== 'updatedAt' && key !== 'updatedBy' && typeof currentData[key] === 'boolean') {
        cleanFlags[key] = currentData[key]
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Feature flag updated successfully.',
      flags: cleanFlags,
    })
  } catch (err: any) {
    console.error('[API_ADMIN_FEATURE_FLAGS] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update feature flags' }, { status: 500 })
  }
}
