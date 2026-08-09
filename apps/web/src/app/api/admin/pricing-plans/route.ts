import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'
import { DEFAULT_CANONICAL_PLANS } from '@/lib/server/feature-access'

/**
 * GET /api/admin/pricing-plans
 * Returns canonical pricing plans from Firestore system/pricing doc (with fallback).
 */
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: true, plans: DEFAULT_CANONICAL_PLANS, source: 'default_offline' })
    }

    const snap = await adminDb.collection('system').doc('pricing').get()
    if (snap.exists) {
      const data = snap.data()!
      const plans = {
        starter: { ...DEFAULT_CANONICAL_PLANS.starter, ...data.starter },
        growth: { ...DEFAULT_CANONICAL_PLANS.growth, ...data.growth },
        enterprise: { ...DEFAULT_CANONICAL_PLANS.enterprise, ...data.enterprise },
      }
      return NextResponse.json({ success: true, plans, source: 'firestore_canonical' })
    }

    return NextResponse.json({ success: true, plans: DEFAULT_CANONICAL_PLANS, source: 'default' })
  } catch (err: any) {
    console.error('[API_ADMIN_PRICING] GET error:', err)
    return NextResponse.json({ success: true, plans: DEFAULT_CANONICAL_PLANS, error: err?.message })
  }
}

/**
 * POST /api/admin/pricing-plans
 * Super Admin authenticated endpoint to persist pricing changes.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { starter, growth, enterprise } = body

    if (!starter || !growth || !enterprise) {
      return NextResponse.json({ error: 'All three plan tiers (starter, growth, enterprise) are required.' }, { status: 400 })
    }

    const payload = {
      starter: {
        id: 'starter',
        name: starter.name || 'Starter Plan',
        priceNgn: Number(starter.priceNgn) || 45000,
        priceUsd: Number(starter.priceUsd) || 49,
        maxBranches: Number(starter.maxBranches) || 1,
        aiCredits: Number(starter.aiCredits) || 5000,
        description: starter.description || DEFAULT_CANONICAL_PLANS.starter.description,
        features: Array.isArray(starter.features) ? starter.features : DEFAULT_CANONICAL_PLANS.starter.features,
        featureMap: starter.featureMap || null,
      },
      growth: {
        id: 'growth',
        name: growth.name || 'Growth Plan',
        priceNgn: Number(growth.priceNgn) || 120000,
        priceUsd: Number(growth.priceUsd) || 129,
        maxBranches: Number(growth.maxBranches) || 5,
        aiCredits: Number(growth.aiCredits) || 25000,
        description: growth.description || DEFAULT_CANONICAL_PLANS.growth.description,
        features: Array.isArray(growth.features) ? growth.features : DEFAULT_CANONICAL_PLANS.growth.features,
        featureMap: growth.featureMap || null,
      },
      enterprise: {
        id: 'enterprise',
        name: enterprise.name || 'Enterprise Plan',
        priceNgn: Number(enterprise.priceNgn) || 350000,
        priceUsd: Number(enterprise.priceUsd) || 399,
        maxBranches: Number(enterprise.maxBranches) || -1,
        aiCredits: Number(enterprise.aiCredits) || 100000,
        description: enterprise.description || DEFAULT_CANONICAL_PLANS.enterprise.description,
        features: Array.isArray(enterprise.features) ? enterprise.features : DEFAULT_CANONICAL_PLANS.enterprise.features,
        featureMap: enterprise.featureMap || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }

    await adminDb.collection('system').doc('pricing').set(payload, { merge: true })

    return NextResponse.json({
      success: true,
      message: 'Canonical Pricing Plans saved successfully.',
      plans: payload,
    })
  } catch (err: any) {
    console.error('[API_ADMIN_PRICING] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to persist pricing plans' }, { status: 500 })
  }
}
