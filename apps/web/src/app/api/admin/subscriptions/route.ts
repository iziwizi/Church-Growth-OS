import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/subscriptions - Lists all church subscriptions and quotas
 * PATCH /api/admin/subscriptions - Updates subscription plan, status, and quotas
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const snap = await adminDb.collection('churches').get()
    const subscriptions: any[] = []

    snap.docs.forEach((d) => {
      const data = d.data()
      subscriptions.push({
        id: d.id,
        churchName: data.name ?? 'Unnamed Church',
        planId: data.subscription?.planId ?? data.plan ?? 'free_trial',
        status: data.subscription?.status ?? data.status ?? 'trialing',
        branchesLimit: data.subscription?.branchesLimit ?? (data.plan === 'enterprise' ? -1 : data.plan === 'growth' ? 5 : 1),
        aiCreditsTotal: data.subscription?.aiCreditsTotal ?? (data.plan === 'enterprise' ? 50000 : data.plan === 'growth' ? 15000 : 2500),
        aiCreditsRemaining: data.subscription?.aiCreditsRemaining ?? 2500,
        trialEnd: data.subscription?.trialEnd ?? null,
      })
    })

    return NextResponse.json({ success: true, subscriptions })
  } catch (err: any) {
    console.error('[API_ADMIN_SUBSCRIPTIONS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load subscriptions' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { churchId, planId, status, branchesLimit, aiCreditsRemaining } = body

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (planId !== undefined) {
      const bLimit = branchesLimit !== undefined ? branchesLimit : (planId === 'enterprise' ? -1 : planId === 'growth' ? 5 : 1)
      const aiTotal = planId === 'enterprise' ? 50000 : planId === 'growth' ? 15000 : 2500
      updatePayload.plan = planId
      updatePayload['subscription.planId'] = planId
      updatePayload['subscription.branchesLimit'] = bLimit
      updatePayload['subscription.aiCreditsTotal'] = aiTotal
    }

    if (status !== undefined) {
      updatePayload['subscription.status'] = status
      updatePayload.status = status === 'canceled' ? 'suspended' : 'active'
    }

    if (aiCreditsRemaining !== undefined) {
      updatePayload['subscription.aiCreditsRemaining'] = Number(aiCreditsRemaining)
    }

    await adminDb.collection('churches').doc(churchId).update(updatePayload)

    return NextResponse.json({ success: true, message: 'Subscription updated successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_SUBSCRIPTIONS] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update subscription' }, { status: 500 })
  }
}
