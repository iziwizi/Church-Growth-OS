/**
 * Central Machine-Readable Plan Features Matrix & Canonical Plans
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

export interface PlanConfig {
  id: string
  name: string
  badge: string
  priceNgn: number
  priceUsd: number
  popular?: boolean
  maxBranches: number
  aiCredits: number
  description: string
  features: string[]
}

export const DEFAULT_CANONICAL_PLANS: Record<'starter' | 'growth' | 'enterprise', PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Growing Churches',
    priceNgn: 45000,
    priceUsd: 49,
    popular: false,
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
    popular: true,
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
    popular: false,
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
