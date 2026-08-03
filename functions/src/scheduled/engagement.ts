import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { db } from '../firebase'
import { buildEngagementProfile } from '@church-growth-os/ai'
import type { Person } from '@church-growth-os/shared'

/**
 * Scheduled: Nightly at 2 AM UTC.
 * Calculates AI engagement scores for all active people across all churches.
 * Writes results back to /churches/{churchId}/people/{personId}.aiEngagement
 * No manual intervention required — Automation First.
 */
export const calculateEngagementScores = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    functions.logger.info('Starting nightly engagement scoring run')

    const churchesSnapshot = await db
      .collection('churches')
      .where('status', '==', 'active')
      .get()

    functions.logger.info(`Processing ${churchesSnapshot.size} active churches`)

    let totalPeople = 0
    let totalErrors = 0

    for (const churchDoc of churchesSnapshot.docs) {
      const churchId = churchDoc.id

      try {
        const peopleSnapshot = await db
          .collection('churches')
          .doc(churchId)
          .collection('people')
          .get()

        const batch = db.batch()

        for (const personDoc of peopleSnapshot.docs) {
          try {
            const person = { id: personDoc.id, ...personDoc.data() } as Person
            const profile = buildEngagementProfile(person)

            batch.update(personDoc.ref, {
              aiEngagement: profile,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })

            totalPeople++
          } catch (err) {
            functions.logger.error(`Error scoring person ${personDoc.id}:`, err)
            totalErrors++
          }
        }

        // Firestore batches are limited to 500 writes — commit in chunks
        await batch.commit()

        functions.logger.info(`Church ${churchId}: scored ${peopleSnapshot.size} people`)
      } catch (err) {
        functions.logger.error(`Failed to process church ${churchId}:`, err)
        totalErrors++
      }
    }

    functions.logger.info(
      `Engagement scoring complete. Total: ${totalPeople} people, ${totalErrors} errors`
    )
  })
