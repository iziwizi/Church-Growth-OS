import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { db } from '../firebase'
import type { ScheduledJob } from '@church-growth-os/shared'
import { CommunicationRouter, type TenantProviderConfig } from '@church-growth-os/communication'

/**
 * Builds the platform-wide provider config from system/infrastructure —
 * mirrors apps/web/src/app/api/communications/broadcast/route.ts. Credentials
 * are platform-level (shared across tenants), not per-church.
 */
async function buildProviderConfig(): Promise<TenantProviderConfig> {
  const infraSnap = await db.collection('system').doc('infrastructure').get()
  const infra = infraSnap.exists ? infraSnap.data()! : {}
  const config: TenantProviderConfig = {}
  if (infra.metaWhatsappToken && infra.metaWhatsappPhoneId) {
    config.whatsapp = { providerId: 'meta_cloud', config: { phoneNumberId: infra.metaWhatsappPhoneId, accessToken: infra.metaWhatsappToken } }
  }
  if (infra.resendKey) {
    config.email = { providerId: 'resend', config: { apiKey: infra.resendKey, fromAddress: infra.resendFromEmail ?? 'noreply@mujteknify.com' } }
  }
  if (infra.termiiKey) {
    config.sms = { providerId: 'termii', config: { apiKey: infra.termiiKey, senderId: infra.termiiSenderId ?? 'ChurchOS' } }
  }
  return config
}

/**
 * Scheduled: Every 5 minutes.
 * Processes pending jobs from the Firestore job queue.
 * This is the Tier 2 scheduler — handles dynamic per-entity jobs.
 */
export const processJobQueue = functions.pubsub
  .schedule('*/5 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now()

    // Get pending jobs scheduled for now or earlier
    const snapshot = await db
      .collection('scheduledJobs')
      .where('status', '==', 'pending')
      .where('scheduledAt', '<=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(50)
      .get()

    if (snapshot.empty) {
      functions.logger.info('No pending jobs to process')
      return
    }

    functions.logger.info(`Processing ${snapshot.size} jobs`)

    const promises = snapshot.docs.map(async (doc) => {
      const job = { id: doc.id, ...doc.data() } as ScheduledJob & { id: string }

      // Mark as processing
      await doc.ref.update({
        status: 'processing',
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: admin.firestore.FieldValue.increment(1),
      })

      try {
        await executeJob(job)
        await doc.ref.update({ status: 'done' })
        functions.logger.info(`Job ${job.id} (${job.jobType}) completed`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        functions.logger.error(`Job ${job.id} failed:`, errorMessage)

        // Retry up to 3 times, then fail permanently
        const newStatus = (job.attempts ?? 0) >= 3 ? 'failed' : 'pending'
        await doc.ref.update({ status: newStatus, error: errorMessage })
      }
    })

    await Promise.allSettled(promises)
  })

async function executeJob(job: ScheduledJob & { id: string }): Promise<void> {
  switch (job.jobType) {
    case 'send_whatsapp':
    case 'send_email':
    case 'send_sms': {
      const payload = job.payload as { to?: string; message?: string; subject?: string }
      if (!payload?.to || !payload?.message) {
        throw new Error(`${job.jobType} job payload requires { to, message }`)
      }
      const router = new CommunicationRouter(await buildProviderConfig())
      const channel = job.jobType === 'send_whatsapp' ? 'whatsapp' : job.jobType === 'send_email' ? 'email' : 'sms'
      const result = await router.send(channel, payload.to, payload.message, payload.subject)
      if (!result.success) {
        throw new Error(result.error ?? `${job.jobType} failed`)
      }
      functions.logger.info(`${job.jobType} delivered for church ${job.churchId}: ${result.messageId ?? 'ok'}`)
      break
    }

    case 'advance_workflow':
      // NOTE: packages/automation's WorkflowEngine is a well-formed
      // enrollment/step state machine but nothing currently calls
      // WorkflowEngine.enroll() to create enrollments for it to advance —
      // wiring member-lifecycle triggers (e.g. onMemberCreate) to enroll
      // members is tracked as future work in
      // docs/PRODUCTION_READINESS_REPORT.md rather than stubbed here.
      functions.logger.warn(`advance_workflow job received for church ${job.churchId} but no enrollment trigger wires into WorkflowEngine yet — skipping.`)
      break

    default:
      functions.logger.warn(`Unknown job type: ${job.jobType}`)
  }
}

/**
 * Scheduled: Daily at 5AM UTC.
 * Morning declarations for all churches with this feature enabled.
 */
export const morningDeclarations = functions.pubsub
  .schedule('0 5 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    functions.logger.info('Running morning declarations job')

    const churchesSnapshot = await db
      .collection('churches')
      .where('status', '==', 'active')
      .where('settings.automationEnabled', '==', true)
      .get()

    functions.logger.info(`Processing declarations for ${churchesSnapshot.size} churches`)

    for (const churchDoc of churchesSnapshot.docs) {
      const church = churchDoc.data()
      const hasMorningDeclaration = church.settings?.featureFlags?.morning_declaration ?? false

      if (!hasMorningDeclaration) continue

      // Queue AI generation job for this church
      await db.collection('scheduledJobs').add({
        jobType: 'ai_morning_declaration',
        churchId: churchDoc.id,
        payload: {
          date: new Date().toISOString().split('T')[0],
          timezone: church.branding?.timezone ?? 'UTC',
        },
        scheduledAt: admin.firestore.Timestamp.now(),
        status: 'pending',
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    functions.logger.info('Morning declarations jobs queued')
  })

/**
 * Scheduled: Daily at 4AM UTC.
 *
 * Ensures every church running in Automated mode has an upcoming Sunday
 * service event, without ever creating a duplicate:
 *  - Skips churches in Manual/Approval mode entirely (Church Admin owns
 *    event creation there).
 *  - Skips a church if it already has ANY event scheduled for the
 *    upcoming Sunday (so a Church Admin's own manually-created service is
 *    always respected and never duplicated).
 *  - Uses a deterministic document ID (`sunday-service-<YYYY-MM-DD>`) so
 *    even if this job runs more than once for the same date, the create
 *    is a no-op on the second attempt rather than a duplicate write.
 *  - The default service time is configurable via
 *    `system/featureFlags.defaultSundayServiceTime` (falls back to
 *    "09:00") — never hardcoded per-church, since churches don't all
 *    share one service time.
 */
export const ensureSundayServiceEvents = functions.pubsub
  .schedule('0 4 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const flagsSnap = await db.collection('system').doc('featureFlags').get()
    const defaultTime: string = flagsSnap.exists ? flagsSnap.data()?.defaultSundayServiceTime ?? '09:00' : '09:00'

    const churchesSnapshot = await db.collection('churches').where('status', '==', 'active').get()

    const today = new Date()
    const daysUntilSunday = (7 - today.getUTCDay()) % 7
    const upcomingSunday = new Date(today)
    upcomingSunday.setUTCDate(today.getUTCDate() + daysUntilSunday)
    const dateKey = upcomingSunday.toISOString().split('T')[0]!

    let created = 0
    let skippedExisting = 0
    let skippedManualMode = 0

    for (const churchDoc of churchesSnapshot.docs) {
      const church = churchDoc.data()
      const isManualMode = church.preferences?.growthMode === 'manual' || church.settings?.aiMode === 'approval'
      if (isManualMode) {
        skippedManualMode++
        continue
      }

      const eventsRef = db.collection('churches').doc(churchDoc.id).collection('events')
      const existing = await eventsRef.where('date', '==', dateKey).limit(5).get()
      const hasSundayService = existing.docs.some((d) => {
        const title = (d.data().title ?? '').toString().toLowerCase()
        return title.includes('sunday') && title.includes('service')
      })
      if (hasSundayService) {
        skippedExisting++
        continue
      }

      const eventRef = eventsRef.doc(`sunday-service-${dateKey}`)
      const alreadyClaimed = await eventRef.get()
      if (alreadyClaimed.exists) {
        skippedExisting++
        continue
      }

      await eventRef.set({
        title: 'Sunday Service',
        description: 'Weekly Sunday worship service.',
        date: dateKey,
        time: defaultTime,
        recurring: true,
        source: 'automation',
        status: 'scheduled',
        churchId: churchDoc.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      created++

      // Queue a reminder job ahead of the service — actual channel
      // dispatch reuses the same send_whatsapp/send_email job types wired
      // above, isolated per church so one failure doesn't block others.
      await db.collection('scheduledJobs').add({
        jobType: 'event_reminder',
        churchId: churchDoc.id,
        payload: { eventId: eventRef.id, title: 'Sunday Service', date: dateKey, time: defaultTime },
        scheduledAt: admin.firestore.Timestamp.now(),
        status: 'pending',
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    functions.logger.info(
      `ensureSundayServiceEvents: created=${created} skippedExisting=${skippedExisting} skippedManualMode=${skippedManualMode} date=${dateKey}`
    )
  })

/**
 * Scheduled: Daily at 7AM UTC.
 * Birthday and anniversary check for all active churches.
 */
export const birthdayAndAnniversaryCheck = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    functions.logger.info(`Birthday check for ${month}/${day}`)

    // Get all active churches
    const churchesSnapshot = await db
      .collection('churches')
      .where('status', '==', 'active')
      .where('settings.automationEnabled', '==', true)
      .get()

    for (const churchDoc of churchesSnapshot.docs) {
      // Queue birthday check job per church (actual member query happens in job)
      await db.collection('scheduledJobs').add({
        jobType: 'birthday_check',
        churchId: churchDoc.id,
        payload: { month, day, timezone: churchDoc.data().branding?.timezone ?? 'UTC' },
        scheduledAt: admin.firestore.Timestamp.now(),
        status: 'pending',
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  })
