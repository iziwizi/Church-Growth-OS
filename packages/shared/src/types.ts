// ============================================================
// CORE ENTITY TYPES
// ============================================================

export type Timestamp = {
  seconds: number
  nanoseconds: number
  toDate(): Date
}

// ============================================================
// TENANT / CHURCH TYPES
// ============================================================

export type Plan = 'starter' | 'growth' | 'enterprise'
export type ChurchStatus = 'active' | 'suspended' | 'trial'

export interface ChurchBranding {
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  timezone: string
  country: string
  currency: string
}

export interface CommunicationProviderConfig {
  provider: string
  config: Record<string, string>
  isActive: boolean
}

export interface ChurchSettings {
  communicationProviders: {
    whatsapp?: CommunicationProviderConfig
    email?: CommunicationProviderConfig
    sms?: CommunicationProviderConfig
  }
  aiProvider: AIProviderType
  aiMode: AIMode
  featureFlags: Record<string, boolean>
  socialLinks?: SocialLinks
  automationEnabled: boolean
  approvalRequired: boolean
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
  tiktok?: string
  website?: string
}

export interface ChurchSubscription {
  planId: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  currentPeriodEnd: Timestamp
  seats: number
  trialEndsAt?: Timestamp
}

export interface ChurchMetrics {
  totalMembers: number
  totalVisitors: number
  totalDonations: number
  lastUpdated: Timestamp
}

export interface Church {
  id: string
  name: string
  slug: string
  plan: Plan
  status: ChurchStatus
  ownerId: string
  branding: ChurchBranding
  settings: ChurchSettings
  subscription: ChurchSubscription
  metrics: ChurchMetrics
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// USER / AUTH TYPES
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'pastor'
  | 'staff'
  | 'media_staff'
  | 'communications_staff'
  | 'counselling_staff'
  | 'finance_staff'
  | 'cell_leader'
  | 'member_portal'

export interface ChurchMembership {
  churchId: string
  role: UserRole
  joinedAt: Timestamp
  status: 'active' | 'inactive'
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoUrl?: string
  churchMemberships: ChurchMembership[]
  createdAt: Timestamp
}

export interface AuthCustomClaims {
  churchId: string
  role: UserRole
  superAdmin?: boolean
}

// ============================================================
// MEMBER TYPES
// ============================================================

export type MemberStatus = 'active' | 'inactive' | 'visitor_converted'
export type MemberGender = 'male' | 'female' | 'other'

export interface MemberAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface Member {
  id: string
  churchId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsapp?: string
  whatsappStatus: WhatsAppNumberStatus
  dateOfBirth?: Timestamp
  weddingAnniversary?: Timestamp
  gender?: MemberGender
  memberSince: Timestamp
  status: MemberStatus
  cell?: string
  department?: string
  address?: MemberAddress
  tags: string[]
  engagementScore: number
  lastContactedAt?: Timestamp
  baptized: boolean
  notes?: string
  customFields?: Record<string, unknown>
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

// ============================================================
// WHATSAPP VALIDATION
// ============================================================

export type WhatsAppNumberStatus = 'verified' | 'invalid' | 'needs_review' | 'unchecked'

export interface WhatsAppValidationResult {
  number: string
  formatted: string
  status: WhatsAppNumberStatus
  countryCode?: string
  reason?: string
}

// ============================================================
// VISITOR TYPES
// ============================================================

export type VisitorFollowUpStatus = 'new' | 'contacted' | 'attending' | 'member' | 'lost'

export interface Visitor {
  id: string
  churchId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsapp?: string
  whatsappStatus: WhatsAppNumberStatus
  dateOfFirstVisit: Timestamp
  howHeardAboutUs?: string
  interests: string[]
  followUpStatus: VisitorFollowUpStatus
  followUpJourneyId?: string
  assignedTo?: string
  notes?: string
  convertedToMemberId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// SERMON TYPES
// ============================================================

export type SermonStatus = 'draft' | 'published'

export interface RepurposedContent {
  summary?: string
  socialCaptions: Array<{ platform: string; caption: string }>
  whatsappMessage?: string
  prayerPoints: string[]
  keyQuotes: string[]
  emailSubject?: string
  emailBody?: string
}

export interface Sermon {
  id: string
  churchId: string
  title: string
  preacher: string
  date: Timestamp
  series?: string
  scriptures: string[]
  audioUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  youtubeId?: string
  description?: string
  tags: string[]
  status: SermonStatus
  repurposedContent?: RepurposedContent
  aiGenerated: boolean
  views: number
  shares: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// PRAYER REQUEST TYPES
// ============================================================

export type PrayerRequestStatus = 'open' | 'praying' | 'answered' | 'closed'
export type PrayerRequestPrivacy = 'private' | 'cell' | 'leadership' | 'congregation'

export interface PrayerRequest {
  id: string
  churchId: string
  memberId?: string
  memberName: string
  request: string
  isAnonymous: boolean
  category?: string
  status: PrayerRequestStatus
  privacy: PrayerRequestPrivacy
  answeredAt?: Timestamp
  testimony?: string
  assignedTo?: string
  prayerCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// COMMUNICATION TYPES
// ============================================================

export type CommunicationChannel = 'whatsapp' | 'email' | 'sms'
export type CommunicationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
export type CommunicationType = 'broadcast' | 'sequence' | 'triggered'

export interface CommunicationStats {
  sent: number
  delivered: number
  read: number
  clicked: number
  failed: number
}

export interface Communication {
  id: string
  churchId: string
  name: string
  type: CommunicationType
  channel: CommunicationChannel
  status: CommunicationStatus
  recipientFilter: {
    type: 'all_members' | 'segment' | 'tags' | 'manual'
    config: Record<string, unknown>
    count?: number
  }
  content: {
    subject?: string
    body: string
    templateId?: string
    aiGenerated: boolean
  }
  stats: CommunicationStats
  scheduledAt?: Timestamp
  sentAt?: Timestamp
  createdAt: Timestamp
  createdBy: string
}

// ============================================================
// AI TYPES
// ============================================================

export type AIProviderType = 'claude' | 'openai' | 'deepseek'
export type AIMode = 'autonomous' | 'approval'

export type AITaskType =
  | 'sermon.repurpose'
  | 'follow_up.generate'
  | 'social.caption'
  | 'broadcast.compose'
  | 'prayer.generate'
  | 'declaration.generate'
  | 'insight.analyze'
  | 'email.compose'
  | 'testimony.campaign'
  | 'birthday.message'
  | 'anniversary.message'
  | 'event.reminder'
  | 'book.promotion'
  | 'partner.campaign'
  | 'donation.campaign'
  | 'inactive.member.message'

export interface AIGenerationLog {
  id: string
  churchId: string
  taskType: AITaskType
  provider: AIProviderType
  model: string
  prompt: string
  output: string
  tokensUsed: number
  approved: boolean
  approvedBy?: string
  usedInCommunicationId?: string
  createdAt: Timestamp
  createdBy?: string
}

// ============================================================
// AUTOMATION TYPES
// ============================================================

export type WorkflowTriggerType = 'event' | 'schedule' | 'member_action' | 'date_based'
export type WorkflowStepType =
  | 'send_whatsapp'
  | 'send_email'
  | 'send_sms'
  | 'wait'
  | 'condition'
  | 'ai_generate'
  | 'notify_staff'

export interface WorkflowStep {
  id: string
  type: WorkflowStepType
  config: Record<string, unknown>
  nextStepId?: string
  conditions?: unknown[]
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType
  config: Record<string, unknown>
}

export interface AutomationWorkflow {
  id: string
  churchId: string
  name: string
  description?: string
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  isActive: boolean
  enrolledCount: number
  completedCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'paused'

export interface WorkflowEnrollment {
  id: string
  churchId: string
  workflowId: string
  entityId: string
  entityType: 'member' | 'visitor'
  currentStepId: string
  status: EnrollmentStatus
  nextActionAt: Timestamp
  history: Array<{
    stepId: string
    executedAt: Timestamp
    result: string
  }>
  enrolledAt: Timestamp
}

// ============================================================
// DONATION TYPES
// ============================================================

export type DonationType = 'tithe' | 'offering' | 'pledge' | 'partnership' | 'special'
export type PaymentMethod = 'bank' | 'card' | 'ussd' | 'cash' | 'crypto'
export type DonationStatus = 'pending' | 'successful' | 'failed' | 'refunded'

export interface Donation {
  id: string
  churchId: string
  donorId?: string
  donorName: string
  amount: number
  currency: string
  type: DonationType
  paymentMethod: PaymentMethod
  gatewayReference?: string
  gatewayProvider?: string
  status: DonationStatus
  fundId?: string
  note?: string
  receiptSent: boolean
  createdAt: Timestamp
}

// ============================================================
// EVENT TYPES
// ============================================================

export type EventType = 'service' | 'conference' | 'outreach' | 'training' | 'concert'
export type EventStatus = 'draft' | 'published' | 'live' | 'past'

export interface Event {
  id: string
  churchId: string
  title: string
  description?: string
  type: EventType
  startAt: Timestamp
  endAt: Timestamp
  location?: string
  isOnline: boolean
  streamUrl?: string
  bannerUrl?: string
  registrationRequired: boolean
  registrations: number
  remindersScheduled: boolean
  aiGeneratedContent?: {
    reminder1?: string
    reminder2?: string
    socialCaption?: string
  }
  status: EventStatus
  createdAt: Timestamp
}

// ============================================================
// AUDIT LOG TYPES
// ============================================================

export interface AuditLog {
  id: string
  churchId: string
  actorId: string
  actorEmail: string
  action: string
  resourceType: string
  resourceId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp: Timestamp
}

// ============================================================
// SCHEDULED JOB TYPES
// ============================================================

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface ScheduledJob {
  id: string
  jobType: string
  churchId: string
  payload: Record<string, unknown>
  scheduledAt: Timestamp
  status: JobStatus
  attempts: number
  lastAttemptAt?: Timestamp
  error?: string
  createdAt: Timestamp
}

// ============================================================
// AI DAILY MISSION TYPES
// ============================================================

export interface AIDailyMissionItem {
  taskType: AITaskType
  priority: number
  contextId?: string
  contextType?: string
  scheduledFor: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
}

export interface AIDailyMission {
  id: string
  churchId: string
  date: string
  items: AIDailyMissionItem[]
  generatedAt: Timestamp
  completedAt?: Timestamp
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    cursor?: string
  }
}

export interface PaginationParams {
  limit?: number
  cursor?: string
}

// ============================================================
// FEATURE FLAGS
// ============================================================

export type FeatureFlag =
  | 'ai_studio'
  | 'automation'
  | 'communications_whatsapp'
  | 'communications_sms'
  | 'donations'
  | 'partnerships'
  | 'books'
  | 'counselling'
  | 'live_service'
  | 'social_integration'
  | 'advanced_reports'

// ============================================================
// PERMISSION TYPES
// ============================================================

export type Permission =
  | 'members:read'
  | 'members:create'
  | 'members:update'
  | 'members:delete'
  | 'visitors:read'
  | 'visitors:create'
  | 'visitors:update'
  | 'visitors:delete'
  | 'sermons:read'
  | 'sermons:create'
  | 'sermons:update'
  | 'sermons:delete'
  | 'communications:read'
  | 'communications:send'
  | 'communications:schedule'
  | 'donations:read'
  | 'donations:create'
  | 'donations:update'
  | 'counselling:read_own'
  | 'counselling:read_all'
  | 'counselling:manage'
  | 'ai:generate_content'
  | 'ai:approve_content'
  | 'automation:read'
  | 'automation:manage'
  | 'reports:read'
  | 'reports:export'
  | 'settings:read'
  | 'settings:manage'
  | 'users:read'
  | 'users:manage'
  | 'billing:read'
  | 'billing:manage'
  | 'audit:read'

// ============================================================
// EXPORTS
// ============================================================

export * from './errors'
export * from './validators'
