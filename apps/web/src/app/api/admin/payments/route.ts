import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Mask a secret string.
 */
function maskSecret(val?: string): string {
  if (!val || val.length < 8) return val ? '••••••••' : ''
  return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`
}

/**
 * GET /api/admin/payments - Returns payment history and masked payment gateway credentials
 * POST /api/admin/payments - Saves payment gateway credentials to system/infrastructure
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    // 1. Fetch system credentials
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const credentials = {
      paystackPublicKey: data?.paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      paystackSecret: maskSecret(data?.paystackSecret || process.env.PAYSTACK_SECRET_KEY),
      flutterwavePublicKey: data?.flutterwavePublicKey || process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
      flutterwaveSecret: maskSecret(data?.flutterwaveSecret || process.env.FLUTTERWAVE_SECRET_KEY),
      stripePublicKey: data?.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
      stripeSecret: maskSecret(data?.stripeSecret || process.env.STRIPE_SECRET_KEY),
      stripeWebhookSecret: maskSecret(data?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET),
    }

    // 2. Fetch payment transactions
    const paymentSnap = await adminDb.collection('payments').orderBy('createdAt', 'desc').limit(50).get().catch(() => null)
    const transactions: any[] = []

    if (paymentSnap && !paymentSnap.empty) {
      paymentSnap.docs.forEach((d) => {
        const pData = d.data()
        transactions.push({
          id: d.id,
          churchId: pData.churchId ?? '',
          churchName: pData.churchName ?? 'Church Tenant',
          planId: pData.planId ?? 'growth',
          planName: pData.planName ?? 'Growth Plan',
          amount: pData.amount ?? 0,
          currency: pData.currency ?? 'NGN',
          gateway: pData.gateway ?? 'paystack',
          reference: pData.reference ?? d.id,
          status: pData.status ?? 'successful',
          createdAt: pData.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        })
      })
    }

    return NextResponse.json({ success: true, credentials, transactions })
  } catch (err: any) {
    console.error('[API_ADMIN_PAYMENTS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    const fields = [
      'paystackPublicKey', 'paystackSecret',
      'flutterwavePublicKey', 'flutterwaveSecret',
      'stripePublicKey', 'stripeSecret', 'stripeWebhookSecret',
    ]

    fields.forEach((f) => {
      const val = body[f]
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed && !trimmed.includes('••••')) {
          updatePayload[f] = trimmed
        } else if (existingData?.[f]) {
          updatePayload[f] = existingData[f]
        }
      }
    })

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Payment gateway configuration saved successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_PAYMENTS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save payment gateway settings' }, { status: 500 })
  }
}
