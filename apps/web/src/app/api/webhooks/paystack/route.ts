import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue, type Transaction, type DocumentReference } from 'firebase-admin/firestore'
import { getPaystackSecretKey, verifyPaystackTransaction } from '@/lib/server/paystack'
import { DEFAULT_CANONICAL_PLANS } from '@/lib/config/pricing-matrix'

/**
 * POST /api/webhooks/paystack
 *
 * The ONLY place a church's plan is activated after payment. Requirements
 * enforced here (see docs/PRODUCTION_ENGINEERING_AUDIT.md §7):
 *  1. HMAC SHA512 signature verification against the raw body — payloads
 *     that don't match `x-paystack-signature` are rejected outright.
 *  2. Idempotency — Paystack retries webhooks; a `processedWebhookEvents`
 *     doc keyed by event reference is created transactionally so the same
 *     event can never activate/credit a subscription twice.
 *  3. Server-to-server verification via Paystack's /transaction/verify
 *     endpoint before trusting the webhook payload's own claim of success
 *     (defense in depth beyond signature checking alone).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  const secretKey = await getPaystackSecretKey()
  if (!secretKey) {
    console.error('[PAYSTACK_WEBHOOK] No secret key configured — cannot verify signature, rejecting.')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const expectedSignature = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
  if (!signature || signature !== expectedSignature) {
    console.error('[PAYSTACK_WEBHOOK] Signature mismatch — rejecting payload.')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const reference: string | undefined = event?.data?.reference
  if (!reference) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 })
  }

  // Idempotency: atomically claim this event reference. If the doc already
  // exists, this webhook delivery (retry or replay) is a no-op.
  const eventLockRef: DocumentReference = adminDb.collection('processedWebhookEvents').doc(`paystack_${reference}`)
  const claimed = await adminDb.runTransaction(async (tx: Transaction) => {
    const existing = await tx.get(eventLockRef)
    if (existing.exists) return false
    tx.set(eventLockRef, {
      provider: 'paystack',
      reference,
      eventType: event.event ?? 'unknown',
      receivedAt: FieldValue.serverTimestamp(),
    })
    return true
  })

  if (!claimed) {
    console.log('[PAYSTACK_WEBHOOK] Duplicate delivery for reference, skipping:', reference)
    return NextResponse.json({ success: true, duplicate: true })
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ success: true, ignored: event.event })
  }

  try {
    // Never trust the webhook payload's status claim alone — verify
    // server-to-server against Paystack before crediting anything.
    const { ok, data: verifyData } = await verifyPaystackTransaction(secretKey, reference)
    if (!ok || verifyData?.data?.status !== 'success') {
      console.error('[PAYSTACK_WEBHOOK] Verification failed for reference:', reference, verifyData)
      await adminDb.collection('payments').doc(reference).set(
        { status: 'failed', failureReason: 'Verification failed', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )
      return NextResponse.json({ success: true, verified: false })
    }

    const paymentSnap = await adminDb.collection('payments').doc(reference).get()
    if (!paymentSnap.exists) {
      console.error('[PAYSTACK_WEBHOOK] No matching payment record for reference:', reference)
      return NextResponse.json({ success: true, error: 'No matching payment record' })
    }
    const payment = paymentSnap.data()!
    const { churchId, planId } = payment

    await adminDb.collection('payments').doc(reference).update({
      status: 'successful',
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      gatewayResponse: verifyData?.data?.gateway_response ?? null,
    })

    if (churchId && planId) {
      const churchRef = adminDb.collection('churches').doc(churchId)
      const churchSnap = await churchRef.get()
      const church = churchSnap.data() ?? {}
      const canonicalPlan = DEFAULT_CANONICAL_PLANS[planId as keyof typeof DEFAULT_CANONICAL_PLANS]
      const aiCreditsTotal = canonicalPlan?.aiCredits ?? 5000
      const branchesLimit = canonicalPlan?.maxBranches ?? 1

      const updatedSubscription = {
        ...(church.subscription ?? {}),
        planId,
        status: 'active',
        branchesLimit,
        aiCreditsTotal,
        aiCreditsRemaining: (church.subscription?.aiCreditsRemaining ?? 0) + aiCreditsTotal,
        lastPaymentReference: reference,
        renewedAt: FieldValue.serverTimestamp(),
      }

      await churchRef.update({
        plan: planId,
        subscription: updatedSubscription,
        updatedAt: FieldValue.serverTimestamp(),
      })

      await churchRef.collection('notifications').add({
        type: 'alert',
        title: 'Subscription Upgraded',
        description: `Payment confirmed — your church is now on the ${canonicalPlan?.name ?? planId} plan.`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (err: any) {
    console.error('[PAYSTACK_WEBHOOK] Processing error:', err)
    // The event lock stays claimed even on error — a genuine processing
    // bug should be fixed and replayed manually via Paystack's dashboard
    // rather than silently reprocessed forever on every retry.
    return NextResponse.json({ error: err?.message ?? 'Processing error' }, { status: 500 })
  }
}
