import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

const DEFAULT_CANONICAL_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Growing Churches',
    priceNgn: 45000,
    priceUsd: 49,
    maxBranches: 1,
    aiCredits: 5000,
    description: 'Essential ministry automation for single-campus churches.',
    features: [
      'Up to 500 Members & Visitors',
      '5,000 AI Content Credits / Month',
      '1 Satellite Branch',
      'Autonomous Follow-up Workflows',
      'WhatsApp, Email & SMS Broadcasts',
      'Live Service Control Room & Preflight',
      'Church Store (Books, Sermons, Tickets)',
      'Daily 6:00 AM Growth Report',
      'Standard Support (24h SLA)',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan',
    badge: 'Most Popular',
    priceNgn: 120000,
    priceUsd: 129,
    maxBranches: 5,
    aiCredits: 25000,
    description: 'Advanced multi-branch intelligence and autonomous ministry scaling.',
    features: [
      'Up to 2,500 Members & Visitors',
      '25,000 AI Content Credits / Month',
      'Up to 5 Satellite Branches',
      'Autonomous Executive Growth Reports',
      'Priority WhatsApp & Email Delivery Engine',
      'Full AI Studio & Sermon Repurposing',
      'Church Store with Digital Downloads',
      'Multi-User Roles & Permissions Matrix',
      'Priority Pastoral Support (2h SLA)',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    badge: 'Mega Ministries & Networks',
    priceNgn: 350000,
    priceUsd: 399,
    maxBranches: -1, // Unlimited
    aiCredits: 100000,
    description: 'Bespoke infrastructure, dedicated AI capacity, and unlimited global campus networks.',
    features: [
      'Unlimited Members & Visitors',
      '100,000 AI Content Credits / Month',
      'Unlimited Satellite Branches & Campuses',
      'Dedicated Custom AI Fine-Tuning',
      'Church-Owned WhatsApp Business API (WABA)',
      'Custom Dedicated SMS Sender ID',
      'Multi-Campus Financial Consolidation',
      '24/7 Dedicated Account Manager',
      '99.9% Uptime SLA & Custom Domain Routing',
    ],
  },
}

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
