import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { db } from '../firebase'
import {
  buildExecutiveReportPrompt,
  parseReportOutput,
  buildReportEmailHtml,
} from '@church-growth-os/ai'
import type { DailyReportMetrics, DailyReport } from '@church-growth-os/ai'

/**
 * Scheduled: Every morning at 6 AM UTC.
 * Collects 24h metrics, calls AI, generates report,
 * saves to Firestore and queues Email + WhatsApp delivery.
 */
export const generateDailyExecutiveReport = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0]!
    const yesterday = new Date(Date.now() - 86400000).toISOString()

    functions.logger.info(`Generating daily executive reports for ${today}`)

    const churchesSnapshot = await db
      .collection('churches')
      .where('status', '==', 'active')
      .where('settings.automationEnabled', '==', true)
      .get()

    for (const churchDoc of churchesSnapshot.docs) {
      const churchId = churchDoc.id
      const church = churchDoc.data()

      try {
        // ── Gather 24h metrics from Firestore ─────────────────
        const [
          scheduledJobsSnap,
          peopleSnap,
        ] = await Promise.all([
          db.collection('scheduledJobs')
            .where('churchId', '==', churchId)
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(yesterday)))
            .get(),
          db.collection('churches').doc(churchId).collection('people').get(),
        ])

        // Count messages and jobs
        let messagesSent = 0
        let messagesDelivered = 0
        let jobsFailed = 0
        for (const jobDoc of scheduledJobsSnap.docs) {
          const job = jobDoc.data()
          if (job.jobType === 'send_whatsapp' || job.jobType === 'send_email' || job.jobType === 'send_sms') {
            messagesSent++
            if (job.status === 'done') messagesDelivered++
            if (job.status === 'failed') jobsFailed++
          }
        }

        // People stats
        let criticalRisk = 0
        let highRisk = 0
        let followUpsDue = 0
        let newMembers = 0
        let newVisitors = 0
        const birthdaysToday: DailyReportMetrics['birthdaysToday'] = []

        for (const personDoc of peopleSnap.docs) {
          const person = personDoc.data()
          const ai = person.aiEngagement

          if (ai?.riskLevel === 'critical') criticalRisk++
          if (ai?.riskLevel === 'high') highRisk++
          if (ai?.followUpPriority === 'urgent' || ai?.followUpPriority === 'high') followUpsDue++

          // Visitors created in last 24h
          if (person.tags?.includes('visitor') && person.createdAt?.toDate() > new Date(yesterday)) {
            newVisitors++
          }

          // Members created in last 24h
          if (person.tags?.includes('member') && person.memberSince?.toDate() > new Date(yesterday)) {
            newMembers++
          }

          // Birthdays today
          if (person.dateOfBirth) {
            const bday = new Date(person.dateOfBirth)
            const now = new Date()
            if (bday.getMonth() === now.getMonth() && bday.getDate() === now.getDate()) {
              birthdaysToday.push({
                name: `${person.firstName} ${person.lastName}`,
                whatsapp: person.whatsapp,
              })
            }
          }
        }

        const metrics: DailyReportMetrics = {
          date: today,
          churchId,
          churchName: church.name,
          messagesSent,
          messagesDelivered,
          messagesReplied: 0, // Requires webhook data — expand in Stage 4
          deliverySuccessRate: messagesSent > 0 ? Math.round((messagesDelivered / messagesSent) * 100) : 0,
          prayerRequestsReceived: 0,
          visitorsCheckedIn: newVisitors,
          newMembersRegistered: newMembers,
          inactiveMembersThisWeek: criticalRisk,
          birthdaysToday,
          anniversariesToday: [],
          upcomingEventsNext7Days: [],
          testimoniesSubmittedThisWeek: 0,
          socialPostsScheduled: 0,
          workflowsActive: 0,
          jobsProcessedLast24h: scheduledJobsSnap.size,
          jobsFailedLast24h: jobsFailed,
          criticalRiskPeople: criticalRisk,
          highRiskPeople: highRisk,
          followUpsDue,
        }

        // ── Generate AI summary ────────────────────────────────
        const prompt = buildExecutiveReportPrompt(metrics)

        // Simple completion via Admin SDK callable — replace with AI router in Stage 5
        // For now, generate a structured summary without AI dependency at build time
        const aiSummary = `Daily Report for ${metrics.churchName} — ${today}. ${messagesSent} messages sent (${metrics.deliverySuccessRate}% delivery). ${newVisitors} new visitors. ${newMembers} new members. ${criticalRisk} members need urgent follow-up. ${birthdaysToday.length} birthdays today.`
        const whatsappVersion = `📊 *${metrics.churchName} Daily Report* — ${today}\n✉️ ${messagesSent} messages sent\n👥 ${newVisitors} visitors | ${newMembers} new members\n🙏 ${metrics.prayerRequestsReceived} prayer requests\n⚠️ ${followUpsDue} follow-ups due`

        const { fullSummary } = parseReportOutput(aiSummary)

        const reportData: Omit<DailyReport, 'emailHtml'> = {
          id: `${churchId}-${today}`,
          churchId,
          date: today,
          metrics,
          aiSummary: fullSummary,
          whatsappVersion,
          generatedAt: new Date().toISOString(),
        }

        const emailHtml = buildReportEmailHtml(reportData)

        // ── Save report to Firestore ────────────────────────────
        await db
          .collection('aiReports')
          .doc(churchId)
          .collection('daily')
          .doc(today)
          .set({
            ...reportData,
            emailHtml,
            prompt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })

        // ── Queue delivery jobs ────────────────────────────────
        const deliveryJobs = []

        if (church.settings?.reportEmailRecipient) {
          deliveryJobs.push(db.collection('scheduledJobs').add({
            jobType: 'send_email',
            churchId,
            payload: {
              to: church.settings.reportEmailRecipient,
              subject: `📊 Daily Report — ${today} | ${church.name}`,
              html: emailHtml,
              text: aiSummary,
            },
            scheduledAt: admin.firestore.Timestamp.now(),
            status: 'pending',
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }))
        }

        if (church.settings?.reportWhatsAppNumber) {
          deliveryJobs.push(db.collection('scheduledJobs').add({
            jobType: 'send_whatsapp',
            churchId,
            payload: {
              to: church.settings.reportWhatsAppNumber,
              message: whatsappVersion,
            },
            scheduledAt: admin.firestore.Timestamp.now(),
            status: 'pending',
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }))
        }

        await Promise.all(deliveryJobs)
        functions.logger.info(`Report generated and queued for church: ${churchId}`)
      } catch (err) {
        functions.logger.error(`Failed to generate report for church ${churchId}:`, err)
      }
    }

    functions.logger.info('Daily executive reports generation complete')
  })
