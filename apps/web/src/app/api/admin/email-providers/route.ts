import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/email-providers - Returns Resend configuration
 * POST /api/admin/email-providers - Saves Resend configuration securely to system/infrastructure
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const resendKey = data?.resendKey || process.env.RESEND_API_KEY || ''
    const maskedKey = resendKey ? (resendKey.length > 8 ? `${resendKey.substring(0, 4)}••••••••${resendKey.substring(resendKey.length - 4)}` : '••••••••') : ''

    return NextResponse.json({
      success: true,
      config: {
        emailProvider: 'resend',
        resendKey: maskedKey,
        fromEmail: data?.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com',
        fromName: data?.fromName ?? 'Church Growth OS',
        enabled: data?.emailEnabled ?? true,
      },
    })
  } catch (err: any) {
    console.error('[API_ADMIN_EMAIL_PROVIDERS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load email settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { resendKey, fromEmail, fromName, enabled } = body

    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const updatePayload: Record<string, any> = {
      fromEmail: fromEmail?.trim() || existingData?.fromEmail || 'noreply@mujteknify.com',
      fromName: fromName?.trim() || existingData?.fromName || 'Church Growth OS',
      emailEnabled: enabled !== undefined ? enabled : true,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (resendKey && typeof resendKey === 'string' && !resendKey.includes('••••')) {
      updatePayload.resendKey = resendKey.trim()
    }

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Resend email gateway credentials saved successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_EMAIL_PROVIDERS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save email settings' }, { status: 500 })
  }
}
