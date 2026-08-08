import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/churches - Lists all church tenants with live member & visitor counts
 * PATCH /api/admin/churches - Updates church plan or status
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const snap = await adminDb.collection('churches').get()
    const churches: any[] = []

    for (const d of snap.docs) {
      const data = d.data()
      // Best-effort member & visitor count from people collection
      const peopleSnap = await adminDb.collection('churches').doc(d.id).collection('people').get().catch(() => null)
      let members = 0
      let visitors = 0
      if (peopleSnap && !peopleSnap.empty) {
        peopleSnap.docs.forEach((p: any) => {
          const pData = p.data()
          const tags = Array.isArray(pData.tags) ? pData.tags : [pData.tag || 'member']
          if (tags.includes('visitor')) visitors++
          else members++
        })
      }

      // Also check separate visitors collection if used
      const visitorsSnap = await adminDb.collection('churches').doc(d.id).collection('visitors').get().catch(() => null)
      if (visitorsSnap && !visitorsSnap.empty) {
        visitors += visitorsSnap.size
      }

      churches.push({
        id: d.id,
        name: data.name ?? 'Unnamed Church',
        slug: data.slug ?? d.id,
        plan: data.subscription?.planId ?? data.plan ?? 'free_trial',
        status: data.status ?? 'active',
        subscription: data.subscription ?? {
          planId: data.plan ?? 'free_trial',
          status: 'trialing',
          branchesLimit: 1,
          aiCreditsRemaining: 2500,
        },
        membersCount: members,
        visitorsCount: visitors,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      })
    }

    return NextResponse.json({ success: true, churches })
  } catch (err: any) {
    console.error('[API_ADMIN_CHURCHES] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load churches' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { churchId, plan, status } = body

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (plan !== undefined) {
      const branchesLimit = plan === 'enterprise' ? -1 : plan === 'growth' ? 5 : 1
      const aiCreditsTotal = plan === 'enterprise' ? 50000 : plan === 'growth' ? 15000 : 5000
      updatePayload.plan = plan
      updatePayload['subscription.planId'] = plan
      updatePayload['subscription.branchesLimit'] = branchesLimit
      updatePayload['subscription.aiCreditsTotal'] = aiCreditsTotal
    }

    if (status !== undefined) {
      updatePayload.status = status
      updatePayload['subscription.status'] = status === 'suspended' ? 'canceled' : 'active'
    }

    await adminDb.collection('churches').doc(churchId).update(updatePayload)

    return NextResponse.json({ success: true, message: 'Church updated successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_CHURCHES] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update church' }, { status: 500 })
  }
}
