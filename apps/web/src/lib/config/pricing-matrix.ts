/**
 * Central Machine-Readable Plan Features Matrix
 * Safe for both Client and Server execution.
 */

export type MachineFeatureKey =
  | 'ai_studio'
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'store'
  | 'reports'
  | 'live_service'
  | 'giving'
  | 'automation'
  | 'advanced_analytics'
  | 'branch_management'

export const PLAN_FEATURE_MATRIX: Record<string, Record<MachineFeatureKey, boolean>> = {
  free_trial: {
    ai_studio: true,
    sms: false,
    whatsapp: true,
    email: true,
    store: true,
    reports: true,
    live_service: true,
    giving: true,
    automation: true,
    advanced_analytics: false,
    branch_management: false,
  },
  starter: {
    ai_studio: true,
    sms: true,
    whatsapp: true,
    email: true,
    store: true,
    reports: true,
    live_service: true,
    giving: true,
    automation: true,
    advanced_analytics: false,
    branch_management: false,
  },
  growth: {
    ai_studio: true,
    sms: true,
    whatsapp: true,
    email: true,
    store: true,
    reports: true,
    live_service: true,
    giving: true,
    automation: true,
    advanced_analytics: true,
    branch_management: true,
  },
  enterprise: {
    ai_studio: true,
    sms: true,
    whatsapp: true,
    email: true,
    store: true,
    reports: true,
    live_service: true,
    giving: true,
    automation: true,
    advanced_analytics: true,
    branch_management: true,
  },
}
