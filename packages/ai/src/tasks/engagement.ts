// ============================================================
// AI ENGAGEMENT ENGINE — Scoring Logic
// Runs nightly via Cloud Functions.
// Calculates: Engagement Score, Risk Level, Follow-Up Priority
// No manual intervention required.
// ============================================================

import type {
  Person,
  AIEngagementProfile,
  RiskLevel,
  FollowUpPriority,
} from '@church-growth-os/shared'

// ── Scoring weights ───────────────────────────────────────────
const WEIGHTS = {
  recentAttendance: 30,        // Attended in last 30 days
  communicationResponded: 20,  // Replied to a message in last 14 days
  followUpStatus: 15,          // Completed follow-up
  daysAttended: 20,            // Recency score (days since last attendance)
  birthdayAcknowledged: 5,     // Church acknowledged birthday this year
  hasManyTags: 5,              // Active in multiple ministries
  hasContactInfo: 5,           // Has WhatsApp or Email (reachable)
}

// ── Score calculator ──────────────────────────────────────────
export function calculateEngagementScore(person: Person): number {
  let score = 0
  const now = Date.now()
  const msInDay = 86400000

  // Recent attendance
  if (person.lastAttendanceDate) {
    const daysSince = (now - new Date(person.lastAttendanceDate).getTime()) / msInDay
    if (daysSince <= 7) score += WEIGHTS.recentAttendance
    else if (daysSince <= 14) score += WEIGHTS.recentAttendance * 0.75
    else if (daysSince <= 30) score += WEIGHTS.recentAttendance * 0.5
    else if (daysSince <= 60) score += WEIGHTS.recentAttendance * 0.25
  }

  // Communication response
  const hasRecentReply = person.recentCommunications.some((c) => {
    if (c.direction !== 'inbound') return false
    const daysSince = (now - new Date(c.sentAt).getTime()) / msInDay
    return daysSince <= 14
  })
  if (hasRecentReply) score += WEIGHTS.communicationResponded

  // Follow-up status
  if (person.followUpStatus === 'completed') score += WEIGHTS.followUpStatus
  else if (person.followUpStatus === 'in_progress') score += WEIGHTS.followUpStatus * 0.5

  // Days since last attendance recency score
  if (person.lastAttendanceDate) {
    const daysSince = (now - new Date(person.lastAttendanceDate).getTime()) / msInDay
    const recencyScore = Math.max(0, WEIGHTS.daysAttended * (1 - daysSince / 90))
    score += recencyScore
  }

  // Multiple ministries
  if (person.tags.length >= 3) score += WEIGHTS.hasManyTags
  else if (person.tags.length >= 2) score += WEIGHTS.hasManyTags * 0.5

  // Contact reachability
  if (person.whatsapp || person.email) score += WEIGHTS.hasContactInfo

  return Math.min(100, Math.round(score))
}

// ── Risk classifier ───────────────────────────────────────────
export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'low'
  if (score >= 45) return 'medium'
  if (score >= 20) return 'high'
  return 'critical'
}

// ── Follow-up priority ────────────────────────────────────────
export function generateFollowUpPriority(
  person: Person,
  riskLevel: RiskLevel
): FollowUpPriority {
  if (person.followUpStatus === 'lost') return 'none'
  if (person.followUpStatus === 'completed') return 'none'

  if (riskLevel === 'critical') return 'urgent'
  if (riskLevel === 'high') return 'high'

  // Visitors always get elevated priority
  if (person.tags.includes('visitor') && !person.tags.includes('member')) {
    if (riskLevel === 'medium') return 'high'
    return 'medium'
  }

  if (riskLevel === 'medium') return 'medium'
  return 'low'
}

// ── Summary generator ─────────────────────────────────────────
export function generateEngagementSummary(
  person: Person,
  score: number,
  riskLevel: RiskLevel,
  priority: FollowUpPriority
): string {
  const name = person.firstName
  const tags = person.tags.map((t) => t.replace('_', ' ')).join(', ')
  const lastSeen = person.lastAttendanceDate
    ? `Last attendance: ${new Date(person.lastAttendanceDate).toLocaleDateString()}`
    : 'No attendance recorded'

  const riskText = {
    low: 'is actively engaged',
    medium: 'shows moderate engagement',
    high: 'is at risk of disengagement',
    critical: 'is critically disengaged and needs urgent attention',
  }[riskLevel]

  const priorityText = priority !== 'none'
    ? `Follow-up priority: ${priority}.`
    : 'No follow-up required at this time.'

  return `${name} (${tags}) ${riskText}. Score: ${score}/100. ${lastSeen}. ${priorityText}`
}

// ── Build full engagement profile ─────────────────────────────
export function buildEngagementProfile(person: Person): AIEngagementProfile {
  const score = calculateEngagementScore(person)
  const riskLevel = classifyRiskLevel(score)
  const followUpPriority = generateFollowUpPriority(person, riskLevel)
  const summary = generateEngagementSummary(person, score, riskLevel, followUpPriority)

  const recommendations: string[] = []
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Send a personal WhatsApp message from the pastor')
    recommendations.push('Schedule a phone call within 48 hours')
  }
  if (!person.whatsapp && !person.email) {
    recommendations.push('Collect contact information to enable outreach')
  }
  if (person.tags.includes('visitor') && !person.tags.includes('member')) {
    recommendations.push('Invite to a new members class or welcome event')
  }
  if (person.recentCommunications.length === 0) {
    recommendations.push('Start communication history by sending a check-in message')
  }

  return {
    score,
    riskLevel,
    followUpPriority,
    summary,
    recommendations,
    calculatedAt: new Date().toISOString(),
  }
}
