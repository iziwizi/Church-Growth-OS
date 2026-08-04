/**
 * Subscription Tiers & Feature Flag System
 * Controls feature accessibility per church tenant subscription plan.
 */

export type SubscriptionPlan = 'free' | 'starter' | 'growth' | 'enterprise'

export interface PlanFeatures {
  aiEnabled: boolean
  aiMode: 'none' | 'basic' | 'advanced' | 'custom'
  whatsappAutomation: boolean
  emailAutomation: boolean
  smsAutomation: boolean
  multiBranch: boolean
  maxMembers: number
  monthlyAiQuota: number
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    aiEnabled: false,
    aiMode: 'none',
    whatsappAutomation: false,
    emailAutomation: false,
    smsAutomation: false,
    multiBranch: false,
    maxMembers: 100,
    monthlyAiQuota: 0,
  },
  starter: {
    aiEnabled: true,
    aiMode: 'basic',
    whatsappAutomation: false,
    emailAutomation: true,
    smsAutomation: false,
    multiBranch: false,
    maxMembers: 500,
    monthlyAiQuota: 50000,
  },
  growth: {
    aiEnabled: true,
    aiMode: 'advanced',
    whatsappAutomation: true,
    emailAutomation: true,
    smsAutomation: true,
    multiBranch: false,
    maxMembers: 2500,
    monthlyAiQuota: 250000,
  },
  enterprise: {
    aiEnabled: true,
    aiMode: 'custom',
    whatsappAutomation: true,
    emailAutomation: true,
    smsAutomation: true,
    multiBranch: true,
    maxMembers: 100000,
    monthlyAiQuota: 1000000,
  },
}

export function getChurchPlanFeatures(plan?: string): PlanFeatures {
  const normalized = (plan?.toLowerCase() as SubscriptionPlan) ?? 'growth'
  return PLAN_LIMITS[normalized] ?? PLAN_LIMITS.growth
}
