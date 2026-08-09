'use client'

import { useChurchStore } from '@/store'
import { PLAN_FEATURE_MATRIX, type MachineFeatureKey } from '@/lib/server/feature-access'

/**
 * Client-side hook for checking dynamic feature access based on church subscription plan.
 */
export function useFeatureAccess() {
  const { church } = useChurchStore()

  const planId: string =
    church?.subscription?.planId || church?.plan || 'free_trial'

  const hasFeature = (key: MachineFeatureKey): boolean => {
    // 1. Direct custom feature overrides on church if present
    if (church?.featureOverrides && typeof church.featureOverrides[key] === 'boolean') {
      return church.featureOverrides[key]
    }

    // 2. Custom plan features from church subscription
    if (church?.subscription?.featureMap && typeof church.subscription.featureMap[key] === 'boolean') {
      return church.subscription.featureMap[key]
    }

    // 3. Fallback to canonical tier matrix
    const tierMatrix = PLAN_FEATURE_MATRIX[planId] || PLAN_FEATURE_MATRIX.free_trial
    return tierMatrix[key] ?? false
  }

  return {
    planId,
    hasFeature,
    isTrial: planId === 'free_trial' || church?.subscription?.status === 'trialing',
    planName: planId.replace('_', ' ').toUpperCase(),
  }
}
