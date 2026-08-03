// ============================================================
// DAILY AI EXECUTIVE REPORT — Types and Prompt Builder
// Generated every morning at 6 AM UTC.
// Covers all key ministry metrics for the past 24 hours.
// ============================================================

export interface DailyReportMetrics {
  date: string           // ISO date (YYYY-MM-DD)
  churchId: string
  churchName: string

  // Communication
  messagesSent: number
  messagesDelivered: number
  messagesReplied: number
  deliverySuccessRate: number  // percentage

  // People
  prayerRequestsReceived: number
  visitorsCheckedIn: number
  newMembersRegistered: number
  inactiveMembersThisWeek: number

  // Personal milestones
  birthdaysToday: Array<{ name: string; phone?: string; whatsapp?: string }>
  anniversariesToday: Array<{ name: string; phone?: string; whatsapp?: string }>

  // Events
  upcomingEventsNext7Days: Array<{ title: string; date: string; registrations: number }>

  // Testimonies
  testimoniesSubmittedThisWeek: number

  // Social media (placeholder — expand in Stage 5)
  socialPostsScheduled: number

  // Automation health
  workflowsActive: number
  jobsProcessedLast24h: number
  jobsFailedLast24h: number

  // Engagement health
  criticalRiskPeople: number
  highRiskPeople: number
  followUpsDue: number
}

export interface DailyReport {
  id: string
  churchId: string
  date: string           // YYYY-MM-DD
  metrics: DailyReportMetrics
  aiSummary: string      // AI-composed executive summary
  whatsappVersion: string  // Shorter version for WhatsApp delivery
  emailHtml: string      // HTML version for email delivery
  generatedAt: string    // ISO timestamp
}

// ── Prompt builder ────────────────────────────────────────────
export function buildExecutiveReportPrompt(metrics: DailyReportMetrics): string {
  return `You are the Church Growth OS AI Executive Assistant for ${metrics.churchName}.

Generate a concise, encouraging, and professional Daily Executive Report for ${metrics.date}.

Use this data:
- Messages sent: ${metrics.messagesSent} (${metrics.deliverySuccessRate}% delivered, ${metrics.messagesReplied} replies)
- New visitors: ${metrics.visitorsCheckedIn}
- New members: ${metrics.newMembersRegistered}
- Prayer requests: ${metrics.prayerRequestsReceived}
- Inactive members flagged: ${metrics.inactiveMembersThisWeek}
- Birthdays today: ${metrics.birthdaysToday.map((b) => b.name).join(', ') || 'None'}
- Upcoming events (7 days): ${metrics.upcomingEventsNext7Days.map((e) => `${e.title} (${e.date}, ${e.registrations} registered)`).join('; ') || 'None'}
- Testimonies this week: ${metrics.testimoniesSubmittedThisWeek}
- Automation health: ${metrics.workflowsActive} active workflows, ${metrics.jobsProcessedLast24h} jobs processed, ${metrics.jobsFailedLast24h} failed
- At-risk members: ${metrics.criticalRiskPeople} critical, ${metrics.highRiskPeople} high risk
- Follow-ups due today: ${metrics.followUpsDue}

INSTRUCTIONS:
1. Write a 3-4 paragraph executive summary. Tone: warm, pastoral, professional.
2. Highlight wins first, then areas needing attention.
3. End with one AI-recommended action for the pastor today.
4. Keep total length under 400 words.

Then output a section labeled "WHATSAPP_VERSION:" with a shorter version (max 5 sentences, plain text, no markdown, emoji allowed) suitable for WhatsApp delivery.`
}

// ── Parse AI output ───────────────────────────────────────────
export function parseReportOutput(aiOutput: string): {
  fullSummary: string
  whatsappVersion: string
} {
  const parts = aiOutput.split('WHATSAPP_VERSION:')
  return {
    fullSummary: (parts[0] ?? aiOutput).trim(),
    whatsappVersion: (parts[1] ?? '').trim(),
  }
}

// ── Email HTML builder ────────────────────────────────────────
export function buildReportEmailHtml(report: Omit<DailyReport, 'emailHtml'>): string {
  const { metrics, aiSummary, date } = report

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Daily Report — ${date}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 20px;">📊 Daily Executive Report</h1>
    <p style="margin: 8px 0 0; opacity: 0.85;">${metrics.churchName} · ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <h2 style="font-size: 16px; margin-top: 0; color: #374151;">AI Executive Summary</h2>
    <p style="line-height: 1.7; color: #374151;">${aiSummary.replace(/\n/g, '<br>')}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #ede9fe;">
      <th style="padding: 10px; text-align: left; font-size: 14px; color: #5b21b6; border-radius: 6px 0 0 6px;">Metric</th>
      <th style="padding: 10px; text-align: right; font-size: 14px; color: #5b21b6; border-radius: 0 6px 6px 0;">Value</th>
    </tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Messages Sent</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.messagesSent}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Delivery Rate</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.deliverySuccessRate}%</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Replies</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.messagesReplied}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">New Visitors</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.visitorsCheckedIn}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">New Members</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.newMembersRegistered}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Prayer Requests</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.prayerRequestsReceived}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Follow-ups Due</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${metrics.followUpsDue}</td></tr>
    <tr><td style="padding: 10px;">At-Risk Members</td><td style="padding: 10px; text-align: right;">${metrics.criticalRiskPeople} critical / ${metrics.highRiskPeople} high</td></tr>
  </table>

  ${metrics.birthdaysToday.length > 0 ? `
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
    <h3 style="margin-top: 0; font-size: 14px; color: #92400e;">🎂 Birthdays Today</h3>
    <p style="margin: 0; color: #92400e;">${metrics.birthdaysToday.map((b) => b.name).join(', ')}</p>
  </div>` : ''}

  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">Generated by Church Growth OS AI · ${new Date().toLocaleTimeString()}</p>
</body>
</html>`
}
