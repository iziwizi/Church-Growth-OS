'use client'

import { useChurchStore } from '@/store'
import { PLAN_FEATURE_MATRIX, type MachineFeatureKey } from '@/lib/config/pricing-matrix'

/**
 * Client-side hook for checking dynamic feature access based on church subscription plan.
 */
export function useFeatureAccess() {
  const { church } = useChurchStore()

  const anyChurch = church as any
  const planId: string =
    anyChurch?.subscription?.planId || anyChurch?.plan || 'free_trial'

  const hasFeature = (key: MachineFeatureKey): boolean => {
    // 1. Direct custom feature overrides on church if present
    if (anyChurch?.featureOverrides && typeof anyChurch.featureOverrides[key] === 'boolean') {
      return anyChurch.featureOverrides[key]
    }

    // 2. Custom plan features from church subscription
    if (anyChurch?.subscription?.featureMap && typeof anyChurch.subscription.featureMap[key] === 'boolean') {
      return anyChurch.subscription.featureMap[key]
    }

    // 3. Fallback to canonical tier matrix
    const tierMatrix = PLAN_FEATURE_MATRIX[planId] || PLAN_FEATURE_MATRIX.free_trial
    return tierMatrix[key] ?? false
  }

  return {
    planId,
    hasFeature,
    isTrial: planId === 'free_trial' || anyChurch?.subscription?.status === 'trialing',
    planName: planId.replace('_', ' ').toUpperCase(),
  }
}
