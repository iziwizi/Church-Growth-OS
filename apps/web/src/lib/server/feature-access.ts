import { adminDb } from '@/lib/firebase/admin-sdk'
import { isGlobalFeatureEnabled } from '@/lib/server/feature-flags'

import {
  DEFAULT_CANONICAL_PLANS,
  PLAN_FEATURE_MATRIX,
  type MachineFeatureKey,
  type PlanConfig,
} from '@/lib/config/pricing-matrix'

export { DEFAULT_CANONICAL_PLANS, PLAN_FEATURE_MATRIX, type MachineFeatureKey, type PlanConfig }

// Maps each machine-readable plan feature to the platform-wide kill-switch
// that can disable it regardless of plan (system/featureFlags document).
// This is the mapping the product requirement calls
// "Global Feature Flag AND Subscription Plan Entitlement AND User Role
// Permission" — see resolveFeatureAccess below, which is the ONE function
// that should be called anywhere this decision needs to be made.
export const FEATURE_TO_GLOBAL_FLAG: Record<MachineFeatureKey, string> = {
  ai_studio: 'aiStudio',
  sms: 'smsBroadcasting',
  whatsapp: 'whatsappBroadcasting',
  email: 'emailBroadcasting', // no dedicated default flag — defaults to enabled unless a Super Admin adds one
  store: 'churchStore',
  reports: 'dailyExecutiveReport',
  live_service: 'liveServiceAutomations',
  giving: 'financialGiving',
  automation: 'automationEngine',
  advanced_analytics: 'advancedAnalytics',
  branch_management: 'advancedAnalytics',
}

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

export interface FeatureAccessResult {
  allowed: boolean
  globalEnabled: boolean
  planEnabled: boolean
  roleEnabled: boolean
  reason?: string
}

/**
 * THE single feature-access evaluation function for the whole platform:
 *
 *   Final Access = Global Feature Flag AND Subscription Plan Entitlement AND User Role Permission
 *
 * Call this from any API route (or the /api/feature-access endpoint the
 * client hook calls) instead of re-implementing gating logic — see
 * docs/PRODUCTION_ENGINEERING_AUDIT.md §2 for why duplicated/ad-hoc gating
 * across pages previously left disabled features reachable by direct URL
 * or direct API call.
 *
 * `rolePermissions` is the church's `rolePermissions` map (module -> role ->
 * boolean) from Settings → Users & Roles; `role` is the acting user's role
 * within that church. If either is omitted, role is treated as permitted
 * (church owners/admins implicitly have full access, and not every feature
 * has a corresponding role-module entry yet).
 */
export async function resolveFeatureAccess(params: {
  churchId: string
  featureKey: MachineFeatureKey
  role?: string
  rolePermissions?: Record<string, Record<string, boolean>>
  roleModule?: string
}): Promise<FeatureAccessResult> {
  const { churchId, featureKey, role, rolePermissions, roleModule } = params

  const globalFlagKey = FEATURE_TO_GLOBAL_FLAG[featureKey]
  const globalEnabled = await isGlobalFeatureEnabled(globalFlagKey)
  const planEnabled = await hasChurchFeature(churchId, featureKey)

  let roleEnabled = true
  if (role && role !== 'owner' && role !== 'super_admin' && rolePermissions && roleModule) {
    const modulePermissions = rolePermissions[roleModule]
    if (modulePermissions && typeof modulePermissions[role] === 'boolean') {
      roleEnabled = modulePermissions[role]
    }
  }

  const allowed = globalEnabled && planEnabled && roleEnabled

  let reason: string | undefined
  if (!globalEnabled) reason = 'This feature is currently disabled platform-wide by the Super Admin.'
  else if (!planEnabled) reason = `Your subscription plan does not include this feature. Please upgrade to access it.`
  else if (!roleEnabled) reason = 'Your role does not have permission to access this feature.'

  return { allowed, globalEnabled, planEnabled, roleEnabled, reason }
}

/**
 * Gate helper for API routes: returns 403 response if feature is disabled
 * for any of the three reasons above.
 */
export async function requireChurchFeature(
  churchId: string,
  featureKey: MachineFeatureKey,
  opts?: { role?: string; rolePermissions?: Record<string, Record<string, boolean>>; roleModule?: string }
): Promise<{ authorized: boolean; error?: string }> {
  const result = await resolveFeatureAccess({ churchId, featureKey, ...opts })
  if (!result.allowed) {
    return { authorized: false, error: result.reason }
  }
  return { authorized: true }
}
