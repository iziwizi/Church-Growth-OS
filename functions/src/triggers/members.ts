import * as functions from 'firebase-functions'
import { db } from '../firebase'
import type { Member } from '@church-growth-os/shared'

/**
 * Trigger: When a new member document is created.
 * - Write audit log
 * - Update church member count
 * - Enroll in new member onboarding workflow (TODO: Stage 6)
 */
export const onMemberCreate = functions.firestore
  .document('churches/{churchId}/members/{memberId}')
  .onCreate(async (snap, context) => {
    const { churchId, memberId } = context.params as { churchId: string; memberId: string }
    const member = snap.data() as Member

    const batch = db.batch()

    // 1. Write audit log
    const auditRef = db
      .collection('churches')
      .doc(churchId)
      .collection('auditLogs')
      .doc()

    batch.set(auditRef, {
      id: auditRef.id,
      churchId,
      actorId: member.createdBy ?? 'system',
      actorEmail: 'system',
      action: 'member.created',
      resourceType: 'member',
      resourceId: memberId,
      before: null,
      after: { firstName: member.firstName, lastName: member.lastName, status: member.status },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

    // 2. Increment member count
    const churchRef = db.collection('churches').doc(churchId)
    batch.update(churchRef, {
      'metrics.totalMembers': admin.firestore.FieldValue.increment(1),
      'metrics.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
    })

    await batch.commit()

    functions.logger.info(`Member created: ${memberId} in church: ${churchId}`)
  })

/**
 * Trigger: When a member document is deleted.
 * - Write audit log
 * - Decrement church member count
 */
export const onMemberDelete = functions.firestore
  .document('churches/{churchId}/members/{memberId}')
  .onDelete(async (snap, context) => {
    const { churchId, memberId } = context.params as { churchId: string; memberId: string }

    const batch = db.batch()

    // Audit log
    const auditRef = db.collection('churches').doc(churchId).collection('auditLogs').doc()
    batch.set(auditRef, {
      id: auditRef.id,
      churchId,
      actorId: 'system',
      actorEmail: 'system',
      action: 'member.deleted',
      resourceType: 'member',
      resourceId: memberId,
      before: snap.data(),
      after: null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Decrement count
    const churchRef = db.collection('churches').doc(churchId)
    batch.update(churchRef, {
      'metrics.totalMembers': admin.firestore.FieldValue.increment(-1),
      'metrics.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
    })

    await batch.commit()
  })

// Need to import admin for FieldValue
import * as admin from 'firebase-admin'
