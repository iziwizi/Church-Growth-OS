import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { getPaystackSecretKey, initializePaystackTransaction } from '@/lib/server/paystack'
import { DEFAULT_CANONICAL_PLANS } from '@/lib/config/pricing-matrix'
import { getAppUrl } from '@/lib/config/app-url'
import { checkRateLimit } from '@/lib/server/rate-limit'

const PLAN_IDS = ['starter', 'growth', 'enterprise'] as const
type PlanId = (typeof PLAN_IDS)[number]

/**
 * POST /api/payments/paystack/initialize
 *
 * Starts a real Paystack transaction for a plan upgrade. The previous
 * checkout flow (apps/web/src/app/(platform)/pricing/page.tsx) activated
 * the paid plan directly from the client with a fabricated reference and
 * no gateway involved at all — see docs/PRODUCTION_ENGINEERING_AUDIT.md §7.
 *
 * This route:
 *  - never trusts a client-supplied amount — it re-derives the price
 *    server-side from the canonical plan config (system/pricing, falling
 *    back to DEFAULT_CANONICAL_PLANS)
 *  - creates a `payments/{reference}` record with status 'pending'
 *  - returns Paystack's hosted checkout URL for the browser to redirect to
 *
 * The plan is ONLY activated by /api/webhooks/paystack after Paystack
 * confirms payment server-to-server — never by this route, and never by
 * the client.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid || !authCheck.churchId) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`paystack-init:${authCheck.uid}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const planId = body.planId as PlanId
    const currency = body.currency === 'USD' ? 'USD' : 'NGN'

    if (!PLAN_IDS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid planId.' }, { status: 400 })
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service is currently initializing.' }, { status: 503 })
    }

    const churchSnap = await adminDb.collection('churches').doc(authCheck.churchId).get()
    if (!churchSnap.exists) {
      return NextResponse.json({ error: 'Church not found.' }, { status: 404 })
    }
    const church = churchSnap.data()!

    // Re-derive price server-side — never trust a client-supplied amount.
    const pricingSnap = await adminDb.collection('system').doc('pricing').get()
    const canonicalPlan = {
      ...DEFAULT_CANONICAL_PLANS[planId],
      ...(pricingSnap.exists ? pricingSnap.data()?.[planId] : {}),
    }
    const priceNgn = Number(canonicalPlan.priceNgn) || DEFAULT_CANONICAL_PLANS[planId].priceNgn
    const priceUsd = Number(canonicalPlan.priceUsd) || DEFAULT_CANONICAL_PLANS[planId].priceUsd
    const amount = currency === 'NGN' ? priceNgn : priceUsd

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'This plan does not have a configured price yet.' }, { status: 400 })
    }

    // Paystack charges in the smallest currency unit (kobo for NGN, cents for USD).
    const amountMinorUnits = Math.round(amount * 100)

    const secretKey = await getPaystackSecretKey()
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Paystack is not configured on the server. Please contact support.' },
        { status: 503 }
      )
    }

    const reference = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const appUrl = getAppUrl(req)

    await adminDb.collection('payments').doc(reference).set({
      id: reference,
      reference,
      churchId: authCheck.churchId,
      churchName: church.name ?? 'Church Tenant',
      userId: authCheck.uid,
      planId,
      planName: canonicalPlan.name ?? planId,
      amount,
      amountMinorUnits,
      currency,
      gateway: 'paystack',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const { ok, data } = await initializePaystackTransaction(secretKey, {
      email: authCheck.email ?? church.ownerEmail ?? 'no-reply@mujteknify.com',
      amountKobo: amountMinorUnits,
      reference,
      callbackUrl: `${appUrl}/pricing?paystack_ref=${reference}`,
      metadata: { churchId: authCheck.churchId, planId, currency },
    })

    if (!ok || !data?.status) {
      console.error('[PAYSTACK_INIT] Paystack rejected initialize request:', data)
      await adminDb.collection('payments').doc(reference).update({ status: 'failed', failureReason: data?.message ?? 'Paystack rejected the request' })
      return NextResponse.json({ error: data?.message ?? 'Could not start Paystack checkout.' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      reference,
      authorizationUrl: data.data?.authorization_url,
    })
  } catch (err: any) {
    console.error('[PAYSTACK_INIT] Unexpected error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to start checkout.' }, { status: 500 })
  }
}
