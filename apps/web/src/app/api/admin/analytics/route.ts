import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'

const PLAN_PRICES_NGN: Record<string, number> = {
  starter: 25000,
  growth: 55000,
  enterprise: 150000,
}

/**
 * GET /api/admin/analytics - Computes real MRR, ARR, churn, token consumption from Firestore
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const [churchesSnap, usersSnap] = await Promise.all([
      adminDb.collection('churches').get(),
      adminDb.collection('users').get(),
    ])

    const totalChurches = churchesSnap.size
    const totalUsers = usersSnap.size

    let mrrNgn = 0
    let paidChurches = 0
    let trialChurches = 0
    let canceledChurches = 0
    let totalAiCreditsConsumed = 0

    churchesSnap.docs.forEach((d: any) => {
      const c = d.data()
      const status = c.subscription?.status ?? c.status ?? 'trialing'
      const planId = (c.subscription?.planId ?? c.plan ?? 'free_trial').toLowerCase()

      const aiTotal = c.subscription?.aiCreditsTotal ?? 2500
      const aiRemaining = c.subscription?.aiCreditsRemaining ?? aiTotal
      totalAiCreditsConsumed += Math.max(0, aiTotal - aiRemaining)

      if (status === 'active' && planId !== 'free_trial') {
        paidChurches++
        mrrNgn += PLAN_PRICES_NGN[planId] || PLAN_PRICES_NGN.starter!
      } else if (status === 'trialing' || planId === 'free_trial') {
        trialChurches++
      } else if (status === 'canceled' || status === 'suspended') {
        canceledChurches++
      }
    })

    const arrNgn = mrrNgn * 12
    const base = paidChurches + canceledChurches
    const churnRate = base > 0 ? Math.round((canceledChurches / base) * 100 * 10) / 10 : 0

    return NextResponse.json({
      success: true,
      metrics: {
        totalChurches,
        totalUsers,
        paidChurches,
        trialChurches,
        canceledChurches,
        mrrNgn,
        arrNgn,
        churnRate,
        totalAiCreditsConsumed,
      },
    })
  } catch (err: any) {
    console.error('[API_ADMIN_ANALYTICS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to compute analytics' }, { status: 500 })
  }
}
