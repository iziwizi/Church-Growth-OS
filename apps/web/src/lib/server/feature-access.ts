import { adminDb } from '@/lib/firebase/admin-sdk'

import {
  DEFAULT_CANONICAL_PLANS,
  PLAN_FEATURE_MATRIX,
  type MachineFeatureKey,
  type PlanConfig,
} from '@/lib/config/pricing-matrix'

export { DEFAULT_CANONICAL_PLANS, PLAN_FEATURE_MATRIX, type MachineFeatureKey, type PlanConfig }

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
