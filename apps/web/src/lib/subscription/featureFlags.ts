/**
 * Subscription Tiers & Feature Flag System
 * Controls feature accessibility and automatic quota allocation per church tenant subscription plan.
 */

export type SubscriptionPlan = 'free' | 'starter' | 'growth' | 'enterprise'

export interface PlanFeatures {
  aiEnabled: boolean
  aiMode: 'none' | 'basic' | 'advanced' | 'custom'
  allowedAiModels: string[]
  whatsappAutomation: boolean
  emailAutomation: boolean
  smsAutomation: boolean
  multiBranch: boolean
  maxMembers: number
  monthlyAiQuota: number
  storageQuotaGb: number
  reportsEnabled: boolean
  executiveReportsEnabled: boolean
  supportTier: 'standard' | 'priority' | 'dedicated'
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    aiEnabled: false,
    aiMode: 'none',
    allowedAiModels: [],
    whatsappAutomation: false,
    emailAutomation: false,
    smsAutomation: false,
    multiBranch: false,
    maxMembers: 100,
    monthlyAiQuota: 0,
    storageQuotaGb: 2,
    reportsEnabled: true,
    executiveReportsEnabled: false,
    supportTier: 'standard',
  },
  starter: {
    aiEnabled: true,
    aiMode: 'basic',
    allowedAiModels: ['Claude 3.5 Sonnet', 'GPT-4o'],
    whatsappAutomation: false,
    emailAutomation: true,
    smsAutomation: false,
    multiBranch: false,
    maxMembers: 500,
    monthlyAiQuota: 50000,
    storageQuotaGb: 10,
    reportsEnabled: true,
    executiveReportsEnabled: true,
    supportTier: 'standard',
  },
  growth: {
    aiEnabled: true,
    aiMode: 'advanced',
    allowedAiModels: ['Claude 3.5 Sonnet', 'GPT-4o', 'DeepSeek V3'],
    whatsappAutomation: true,
    emailAutomation: true,
    smsAutomation: true,
    multiBranch: false,
    maxMembers: 2500,
    monthlyAiQuota: 250000,
    storageQuotaGb: 50,
    reportsEnabled: true,
    executiveReportsEnabled: true,
    supportTier: 'priority',
  },
  enterprise: {
    aiEnabled: true,
    aiMode: 'custom',
    allowedAiModels: ['Claude 3.5 Sonnet', 'GPT-4o', 'DeepSeek V3', 'Gemini 1.5 Pro'],
    whatsappAutomation: true,
    emailAutomation: true,
    smsAutomation: true,
    multiBranch: true,
    maxMembers: 100000,
    monthlyAiQuota: 1000000,
    storageQuotaGb: 500,
    reportsEnabled: true,
    executiveReportsEnabled: true,
    supportTier: 'dedicated',
  },
}

export function getChurchPlanFeatures(plan?: string): PlanFeatures {
  const normalized = (plan?.toLowerCase() as SubscriptionPlan) ?? 'growth'
  return PLAN_LIMITS[normalized] ?? PLAN_LIMITS.growth
}
