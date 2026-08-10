import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { executeAIGateway } from '@/lib/server/ai-gateway'
import { sendEmail } from '@/lib/server/resend'
import { getAppUrl } from '@/lib/config/app-url'
import { CommunicationRouter, type TenantProviderConfig } from '@church-growth-os/communication'

export interface DailyGrowthReportSummary {
  churchId: string
  churchName: string
  date: string
  metrics: {
    totalMembers: number
    newMembersThisWeek: number
    totalVisitors: number
    newVisitorsThisWeek: number
    pendingFollowups: number
    openPrayerRequests: number
    newTestimonies: number
    givingTotalNgn: number
    storeOrdersCount: number
    upcomingEventsCount: number
  }
  upcomingEvents: Array<{ title: string; date: string }>
  growthObjective: string | null
  pastoralInsights: string
  recommendedActions: Array<{
    title: string
    description: string
    actionUrl: string
    urgency: 'high' | 'medium' | 'low'
  }>
  recipient: {
    name: string
    title: string
    email: string
    phone?: string
  }
  deliveredChannels: string[]
  generatedAt: string
}

/**
 * Generates and delivers the 6:00 AM Executive Daily Church Growth Report.
 */
export async function generateAndDeliverDailyReport(churchId: string): Promise<{
  success: boolean
  report?: DailyGrowthReportSummary
  error?: string
}> {
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized' }
  }

  try {
    const churchDoc = await adminDb.collection('churches').doc(churchId).get()
    if (!churchDoc.exists) {
      return { success: false, error: 'Church not found' }
    }

    const church = churchDoc.data()!
    const churchName = church.name || 'Church'
    const seniorPastor = church.seniorPastor || {}
    const pastorName = seniorPastor.name || 'Senior Pastor'
    const pastorTitle = seniorPastor.title || 'Pastor'
    const pastorEmail = seniorPastor.email || church.churchEmail || ''
    const pastorPhone = seniorPastor.phone || ''

    // 1. Gather live statistics from subcollections
    const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const todayDateStr = new Date().toISOString().split('T')[0]!

    const [membersSnap, visitorsSnap, prayersSnap, testimoniesSnap, storeSnap, donationsSnap, eventsSnap] = await Promise.all([
      adminDb.collection('churches').doc(churchId).collection('members').get().catch(() => ({ size: 0, docs: [] } as any)),
      adminDb.collection('churches').doc(churchId).collection('visitors').get().catch(() => ({ size: 0, docs: [] } as any)),
      adminDb.collection('churches').doc(churchId).collection('prayerRequests').where('status', '==', 'pending').get().catch(() => ({ size: 0 } as any)),
      adminDb.collection('churches').doc(churchId).collection('testimonies').get().catch(() => ({ size: 0 } as any)),
      adminDb.collection('churches').doc(churchId).collection('orders').get().catch(() => ({ size: 0 } as any)),
      adminDb.collection('churches').doc(churchId).collection('donations').where('createdAt', '>=', sevenDaysAgo).get().catch(() => ({ size: 0, docs: [] } as any)),
      adminDb.collection('churches').doc(churchId).collection('events').where('date', '>=', todayDateStr).orderBy('date', 'asc').limit(5).get().catch(() => ({ size: 0, docs: [] } as any)),
    ])

    const totalMembers = membersSnap.size || 0
    const totalVisitors = visitorsSnap.size || 0
    const openPrayerRequests = prayersSnap.size || 0
    const newTestimonies = testimoniesSnap.size || 0
    const storeOrdersCount = storeSnap.size || 0

    // Filter pending follow-ups
    let pendingFollowups = 0
    if (visitorsSnap.docs) {
      pendingFollowups = visitorsSnap.docs.filter((d: any) => {
        const data = d.data()
        return data.followUpStatus === 'pending' || data.status === 'first_timer'
      }).length
    }

    const isWithinLastWeek = (data: any) => {
      const created = data.createdAt
      if (!created?.toMillis) return false
      return created.toMillis() >= sevenDaysAgo.toMillis()
    }
    const newMembersThisWeek = (membersSnap.docs ?? []).filter((d: any) => isWithinLastWeek(d.data())).length
    const newVisitorsThisWeek = (visitorsSnap.docs ?? []).filter((d: any) => isWithinLastWeek(d.data())).length
    const givingTotalNgn = (donationsSnap.docs ?? []).reduce((sum: number, d: any) => sum + (Number(d.data().amount) || 0), 0)
    const upcomingEvents = (eventsSnap.docs ?? []).map((d: any) => ({ title: d.data().title ?? 'Event', date: d.data().date ?? '' }))

    const metrics = {
      totalMembers,
      newMembersThisWeek,
      totalVisitors,
      newVisitorsThisWeek,
      pendingFollowups,
      openPrayerRequests,
      newTestimonies,
      givingTotalNgn,
      storeOrdersCount,
      upcomingEventsCount: upcomingEvents.length,
    }

    const growthObjective: string | null =
      church.growthObjectives?.primary || church.growthObjectives?.custom || null

    // 2. Generate Pastoral Executive Insights via AgentRouter AI Gateway
    const prompt = `Church: "${churchName}". Senior Leader: ${pastorTitle} ${pastorName}.
${growthObjective ? `Church's stated growth objective: "${growthObjective}".` : ''}
Metrics Summary:
- Total Congregation Members: ${metrics.totalMembers} (${metrics.newMembersThisWeek} new this week)
- First-time Visitors on Record: ${metrics.totalVisitors} (${metrics.newVisitorsThisWeek} new this week)
- Pending Guest Follow-ups: ${metrics.pendingFollowups}
- Open Member Prayer Requests: ${metrics.openPrayerRequests}
- Testimonies Recorded: ${metrics.newTestimonies}
- Giving This Week: ₦${metrics.givingTotalNgn.toLocaleString()}
- Store Orders: ${metrics.storeOrdersCount}
- Upcoming Events: ${upcomingEvents.length > 0 ? upcomingEvents.map((e: { title: string; date: string }) => `${e.title} (${e.date})`).join(', ') : 'None scheduled'}

Generate a concise 6:00 AM Executive Daily Growth briefing for the Senior Pastor.
Include:
1. Spiritual Encouragement & State of Ministry (2 paragraphs).
2. Top 3 Strategic Pastoral Action Priorities for today${growthObjective ? ', tied to the stated growth objective where relevant' : ''}.`

    const aiRes = await executeAIGateway({
      prompt,
      task: 'DAILY_REPORT',
      churchId,
      churchName,
    })

    const pastoralInsights = aiRes.result || `Good morning ${pastorTitle} ${pastorName}. Today presents fresh ministry opportunities to nurture first-time guests and shepherd the congregation with intentionality.`

    const recommendedActions = [
      {
        title: 'Review First-Time Visitor Retention',
        description: `You have ${metrics.pendingFollowups} guests awaiting personalized follow-up contact.`,
        actionUrl: '/visitors',
        urgency: metrics.pendingFollowups > 0 ? ('high' as const) : ('low' as const),
      },
      {
        title: 'Minister to Congregation Prayer Requests',
        description: `${metrics.openPrayerRequests} pending prayer requests submitted by members.`,
        actionUrl: '/prayer-requests',
        urgency: metrics.openPrayerRequests > 0 ? ('high' as const) : ('low' as const),
      },
      {
        title: 'Broadcast Midweek Fellowship Update',
        description: 'Send an automated WhatsApp/Email devotional to maintain weekly congregation connection.',
        actionUrl: '/communications',
        urgency: 'medium' as const,
      },
      ...(upcomingEvents.length === 0
        ? [{
            title: 'Do you have an upcoming event?',
            description: 'No events are scheduled. Add your next service or gathering so members and visitors are notified.',
            actionUrl: '/events',
            urgency: 'medium' as const,
          }]
        : []),
    ]

    const deliveredChannels: string[] = ['in_app']
    const todayStr = new Date().toISOString().split('T')[0]!
    const appUrl = getAppUrl()

    // 3. Save report in Firestore under churches/{churchId}/dailyReports
    const reportRef = await adminDb.collection('churches').doc(churchId).collection('dailyReports').add({
      date: todayStr,
      metrics,
      upcomingEvents,
      growthObjective,
      pastoralInsights,
      recommendedActions,
      recipient: {
        name: pastorName,
        title: pastorTitle,
        email: pastorEmail,
        phone: pastorPhone,
      },
      deliveredChannels,
      createdAt: FieldValue.serverTimestamp(),
    })

    // 4. In-App Notification — written to the church's own notifications
    // subcollection (the only one the notification bell actually reads;
    // see docs/PRODUCTION_ENGINEERING_AUDIT.md §8 for the top-level-vs-
    // subcollection bug this previously repeated).
    await adminDb.collection('churches').doc(churchId).collection('notifications').add({
      type: 'ai',
      title: `☀️ 6:00 AM Daily Growth Report — ${todayStr}`,
      description: `Your executive ministry briefing is ready. ${metrics.pendingFollowups} visitor follow-ups and ${metrics.openPrayerRequests} prayer requests require attention.`,
      link: '/reports',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    // 5. Send via Email (Resend) if pastor email exists
    if (pastorEmail) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Daily Church Growth Report</h1>
              <p style="color: #e0e7ff; margin: 4px 0 0 0; font-size: 13px;">${churchName} • ${todayStr}</p>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; font-weight: bold; margin-top: 0;">Good morning ${pastorTitle} ${pastorName},</p>
              
              <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; white-space: pre-wrap;">${pastoralInsights}</p>
              </div>

              <h3 style="font-size: 14px; color: #1e293b; margin-top: 20px;">Key Ministry Metrics</h3>
              <ul style="font-size: 13px; color: #475569; padding-left: 20px;">
                <li><strong>Congregation Members:</strong> ${metrics.totalMembers} (${metrics.newMembersThisWeek} new this week)</li>
                <li><strong>First-time Visitors:</strong> ${metrics.totalVisitors} (${metrics.newVisitorsThisWeek} new this week)</li>
                <li><strong>Pending Guest Follow-ups:</strong> ${metrics.pendingFollowups}</li>
                <li><strong>Open Prayer Requests:</strong> ${metrics.openPrayerRequests}</li>
                ${metrics.givingTotalNgn > 0 ? `<li><strong>Giving This Week:</strong> ₦${metrics.givingTotalNgn.toLocaleString()}</li>` : ''}
              </ul>

              ${upcomingEvents.length === 0 ? `
              <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; margin: 16px 0; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #92400e;">Do you have an upcoming event?</p>
                <a href="${appUrl}/events" style="background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; font-size: 12px; display: inline-block;">Schedule an Event →</a>
              </div>` : ''}

              <div style="margin-top: 20px;">
                ${recommendedActions.slice(0, 3).map((a) => `
                <div style="border-left: 3px solid ${a.urgency === 'high' ? '#dc2626' : '#4f46e5'}; padding: 8px 12px; margin-bottom: 8px; background: #f8fafc;">
                  <a href="${appUrl}${a.actionUrl}" style="color: #1e293b; text-decoration: none; font-size: 13px; font-weight: bold;">${a.title} →</a>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${a.description}</p>
                </div>`).join('')}
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; font-size: 13px; display: inline-block;">
                  Open Church Growth OS Dashboard →
                </a>
              </div>
            </div>
          </div>
        `

        await sendEmail({
          to: pastorEmail,
          subject: `☀️ 6:00 AM Executive Daily Growth Report — ${churchName}`,
          html: emailHtml,
          churchId,
        })
        deliveredChannels.push('email')
      } catch (emailErr) {
        console.warn('[DAILY_REPORT] Email dispatch failed:', emailErr)
      }
    }

    // 6. Send a short WhatsApp summary if the platform has WhatsApp
    // configured and the pastor has a phone on file. Isolated failure —
    // never blocks email/in-app delivery, which is why this comes last.
    if (pastorPhone) {
      try {
        const infraSnap = await adminDb.collection('system').doc('infrastructure').get()
        const infra = infraSnap.exists ? infraSnap.data()! : {}
        if (infra.metaWhatsappToken && infra.metaWhatsappPhoneId) {
          const providerConfig: TenantProviderConfig = {
            whatsapp: { providerId: 'meta_cloud', config: { phoneNumberId: infra.metaWhatsappPhoneId, accessToken: infra.metaWhatsappToken } },
          }
          const router = new CommunicationRouter(providerConfig)
          const summary = `☀️ *Daily Growth Report — ${churchName}*\n\nMembers: ${metrics.totalMembers} (+${metrics.newMembersThisWeek})\nVisitors: ${metrics.totalVisitors} (+${metrics.newVisitorsThisWeek})\nFollow-ups pending: ${metrics.pendingFollowups}\nPrayer requests: ${metrics.openPrayerRequests}\n\nFull report: ${appUrl}/reports`
          const waResult = await router.sendWhatsApp(pastorPhone, summary)
          if (waResult.success) deliveredChannels.push('whatsapp')
        }
      } catch (waErr) {
        console.warn('[DAILY_REPORT] WhatsApp dispatch failed:', waErr)
      }
    }

    const finalReport: DailyGrowthReportSummary = {
      churchId,
      churchName,
      date: todayStr,
      metrics,
      upcomingEvents,
      growthObjective,
      pastoralInsights,
      recommendedActions,
      recipient: {
        name: pastorName,
        title: pastorTitle,
        email: pastorEmail,
        phone: pastorPhone,
      },
      deliveredChannels,
      generatedAt: new Date().toISOString(),
    }

    return { success: true, report: finalReport }
  } catch (err: any) {
    console.error('[DAILY_REPORT] Generation error:', err)
    return { success: false, error: err?.message ?? 'Daily report generation failed.' }
  }
}
