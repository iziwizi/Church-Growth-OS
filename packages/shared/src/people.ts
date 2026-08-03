// ============================================================
// UNIFIED PEOPLE ENGINE — Types
// Every individual exists ONCE in the system.
// Tags describe their relationship(s) to the church.
// ============================================================

// All possible person tags (non-exclusive — one person can hold many)
export type PersonTag =
  | 'member'
  | 'visitor'
  | 'pastor'
  | 'worker'
  | 'choir'
  | 'media'
  | 'volunteer'
  | 'donor'
  | 'partner'
  | 'online_follower'
  | 'prayer_request'
  | 'event_attendee'
  | 'book_buyer'

// Human-readable labels for the UI
export const PERSON_TAG_LABELS: Record<PersonTag, string> = {
  member: 'Member',
  visitor: 'Visitor',
  pastor: 'Pastor',
  worker: 'Worker',
  choir: 'Choir',
  media: 'Media',
  volunteer: 'Volunteer',
  donor: 'Donor',
  partner: 'Partner',
  online_follower: 'Online Follower',
  prayer_request: 'Prayer Request',
  event_attendee: 'Event Attendee',
  book_buyer: 'Book Buyer',
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type FollowUpPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'
export type FollowUpStatus = 'none' | 'scheduled' | 'in_progress' | 'completed' | 'lost'

export interface AIEngagementProfile {
  score: number              // 0–100
  riskLevel: RiskLevel
  followUpPriority: FollowUpPriority
  summary: string            // AI-generated engagement summary
  recommendations: string[]  // AI-generated action items
  calculatedAt: string       // ISO date string
}

export interface CommunicationHistoryEntry {
  id: string
  channel: 'whatsapp' | 'email' | 'sms'
  direction: 'outbound' | 'inbound'
  subject?: string
  preview: string            // First 200 chars
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'replied'
  sentAt: string             // ISO date string
  communicationId?: string   // Links to /communications/{id}
}

export interface PersonAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

// ── The Unified Person Entity ─────────────────────────────────
// Stored in: /churches/{churchId}/people/{personId}
export interface Person {
  id: string
  churchId: string

  // Identity
  firstName: string
  lastName: string
  displayName: string   // Computed: "{firstName} {lastName}"

  // Contact
  email?: string
  phone?: string
  whatsapp?: string
  whatsappStatus: 'verified' | 'invalid' | 'needs_review' | 'unchecked'
  address?: PersonAddress

  // Demographics
  gender?: 'male' | 'female' | 'other'
  dateOfBirth?: string          // ISO date string — for birthday engine
  weddingAnniversary?: string   // ISO date string

  // Church relationship
  tags: PersonTag[]             // Multi-tag — one person, many roles
  primaryTag: PersonTag         // The dominant tag for display purposes

  // Attendance & engagement
  lastAttendanceDate?: string   // ISO date
  firstVisitDate?: string       // ISO date
  memberSince?: string          // ISO date (when tagged as 'member')
  followUpStatus: FollowUpStatus
  assignedFollowUpTo?: string   // Staff member ID

  // AI-powered engagement
  aiEngagement?: AIEngagementProfile

  // Communication history
  recentCommunications: CommunicationHistoryEntry[]  // Last 5 entries

  // Notes and metadata
  notes?: string
  customFields?: Record<string, unknown>
  sourceRef?: string   // Migrated from: 'members', 'visitors', etc.

  // Audit
  createdAt: string    // ISO date string
  updatedAt: string
  createdBy: string
  updatedBy?: string
}

// ── Type Guards ───────────────────────────────────────────────
export function isMember(person: Person): boolean {
  return person.tags.includes('member')
}

export function isVisitor(person: Person): boolean {
  return person.tags.includes('visitor') && !person.tags.includes('member')
}

export function hasTag(person: Person, tag: PersonTag): boolean {
  return person.tags.includes(tag)
}

export function getDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

// ── People Filter Options ─────────────────────────────────────
export interface PeopleFilterOptions {
  tags?: PersonTag[]
  followUpStatus?: FollowUpStatus
  riskLevel?: RiskLevel
  searchQuery?: string
  limit?: number
  cursor?: string
}
