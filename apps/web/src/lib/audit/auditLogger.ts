import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export interface AuditLogPayload {
  action:
    | 'USER_CREATED'
    | 'CHURCH_CREATED'
    | 'MEMBERS_IMPORTED'
    | 'EMAIL_SENT'
    | 'WHATSAPP_SENT'
    | 'AI_REQUEST'
    | 'PLAN_CHANGED'
    | 'AUTOMATION_EXECUTED'
    | 'SETTINGS_UPDATED'
    | 'ADMIN_LOGIN'
    | 'ADMIN_LOGOUT'
  actorEmail?: string | null
  actorUid?: string | null
  role?: string | null
  churchId?: string | null
  target?: string | null
  metadata?: Record<string, any>
}

export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      ...payload,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[AUDIT_LOG] Failed to write audit log:', err)
  }
}
