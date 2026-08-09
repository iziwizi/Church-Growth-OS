import { adminDb } from '@/lib/firebase/admin-sdk'

export const DEFAULT_CANONICAL_PLANS = {
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

import { PLAN_FEATURE_MATRIX, type MachineFeatureKey } from '@/lib/config/pricing-matrix'
export { PLAN_FEATURE_MATRIX, type MachineFeatureKey }

/**
 * Retrieves the canonical feature matrix for a specific church based on its subscription plan.
 * Reads live system/pricing from Firestore.
 */
export async function getChurchFeatureMatrix(churchId: string): Promise<Record<MachineFeatureKey, boolean>> {
  if (!churchId || !adminDb) {
    return PLAN_FEATURE_MATRIX.free_trial
  }

  try {
    // 1. Get church subscription
    const churchSnap = await adminDb.collection('churches').doc(churchId).get()
    if (!churchSnap.exists) {
      return PLAN_FEATURE_MATRIX.free_trial
    }

    const churchData = churchSnap.data()!
    const planId: string = churchData.subscription?.planId || churchData.plan || 'free_trial'

    // 2. Read canonical pricing plans from system/pricing
    const pricingSnap = await adminDb.collection('system').doc('pricing').get()
    if (pricingSnap.exists) {
      const pricingData = pricingSnap.data()!
      const planConfig = pricingData[planId]

      if (planConfig && planConfig.featureMap) {
        return {
          ...PLAN_FEATURE_MATRIX[planId as keyof typeof PLAN_FEATURE_MATRIX] || PLAN_FEATURE_MATRIX.free_trial,
          ...planConfig.featureMap,
        }
      }
    }

    return PLAN_FEATURE_MATRIX[planId as keyof typeof PLAN_FEATURE_MATRIX] || PLAN_FEATURE_MATRIX.free_trial
  } catch (err) {
    console.error(`[FEATURE_ACCESS] Error determining feature matrix for church ${churchId}:`, err)
    return PLAN_FEATURE_MATRIX.free_trial
  }
}

/**
 * Checks if a church has access to a specific machine-readable feature.
 */
export async function hasChurchFeature(churchId: string, featureKey: MachineFeatureKey): Promise<boolean> {
  const matrix = await getChurchFeatureMatrix(churchId)
  return matrix[featureKey] ?? false
}

/**
 * Gate helper for API routes: returns 403 response if feature is disabled on the church plan.
 */
export async function requireChurchFeature(
  churchId: string,
  featureKey: MachineFeatureKey
): Promise<{ authorized: boolean; error?: string }> {
  const allowed = await hasChurchFeature(churchId, featureKey)
  if (!allowed) {
    return {
      authorized: false,
      error: `Feature "${featureKey.toUpperCase()}" is not included in your current subscription plan. Please upgrade to access this functionality.`,
    }
  }
  return { authorized: true }
}
