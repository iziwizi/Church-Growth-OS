import { adminDb } from '@/lib/firebase/admin-sdk'

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  aiStudio: true,
  automationEngine: true,
  whatsappBroadcasting: true,
  smsBroadcasting: true,
  liveServiceAutomations: true,
  financialGiving: true,
  partnershipsModule: true,
  churchStore: true,
  dailyExecutiveReport: true,
  advancedAnalytics: true,
}

/**
 * Checks if a global feature flag is enabled on the platform.
 */
export async function isGlobalFeatureEnabled(featureKey: string): Promise<boolean> {
  if (!adminDb) {
    return DEFAULT_FEATURE_FLAGS[featureKey] ?? true
  }

  try {
    const snap = await adminDb.collection('system').doc('featureFlags').get()
    if (snap.exists) {
      const data = snap.data()!
      if (typeof data[featureKey] === 'boolean') {
        return data[featureKey]
      }
    }
  } catch (err) {
    console.warn(`[FEATURE_FLAGS] Could not check flag ${featureKey}:`, err)
  }

  return DEFAULT_FEATURE_FLAGS[featureKey] ?? true
}
