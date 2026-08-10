import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'
import { sendSupportEmailNotification } from '@/lib/email/resend'

type Scope = 'all' | 'selected_churches' | 'selected_users'

/**
 * GET /api/admin/announcements - list past announcements
 * POST /api/admin/announcements - create + fan out an announcement
 *
 * Recipient targeting (all / selected churches / selected users), a
 * recipient-count preview, and persisted sender/scope/recipientIds/delivery
 * status are all implemented here — the previous version only wrote
 * {title, message, createdAt} with no scope, no recipients, and no consumer
 * anywhere in the church-facing app (docs/PRODUCTION_ENGINEERING_AUDIT.md §4).
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error ?? 'Unauthorized' }, { status: 403 })
  }

  try {
    const snap = await adminDb.collection('announcements').orderBy('createdAt', 'desc').limit(50).get()
    const announcements = snap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        title: data.title,
        message: data.message,
        scope: data.scope ?? 'all',
        recipientCount: data.recipientCount ?? 0,
        deliveryStatus: data.deliveryStatus ?? 'sent',
        senderEmail: data.senderEmail ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      }
    })
    return NextResponse.json({ success: true, announcements })
  } catch (err: any) {
    console.error('[API_ADMIN_ANNOUNCEMENTS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error ?? 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    const message = String(body.message ?? '').trim()
    const scope = (body.scope ?? 'all') as Scope
    const churchIds: string[] = Array.isArray(body.churchIds) ? body.churchIds.filter((v: unknown) => typeof v === 'string') : []
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds.filter((v: unknown) => typeof v === 'string') : []

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required.' }, { status: 400 })
    }
    if (scope === 'selected_churches' && churchIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one church.' }, { status: 400 })
    }
    if (scope === 'selected_users' && userIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one user.' }, { status: 400 })
    }

    // Resolve the target church list server-side — never trust a client
    // count, and never hardcode IDs.
    let targetChurchIds: string[] = []
    if (scope === 'all') {
      const allChurches = await adminDb.collection('churches').select().get()
      targetChurchIds = allChurches.docs.map((d: any) => d.id)
    } else if (scope === 'selected_churches') {
      targetChurchIds = [...new Set(churchIds)]
    } else {
      // selected_users: resolve each user's churchId
      const churchIdSet = new Set<string>()
      await Promise.all(
        userIds.map(async (uid) => {
          const userSnap = await adminDb.collection('users').doc(uid).get()
          const churchId = userSnap.exists ? userSnap.data()?.churchId : null
          if (churchId) churchIdSet.add(churchId)
        })
      )
      targetChurchIds = [...churchIdSet]
    }

    const announcementRef = adminDb.collection('announcements').doc()
    await announcementRef.set({
      title,
      message,
      scope,
      churchIds: scope === 'selected_churches' ? targetChurchIds : [],
      userIds: scope === 'selected_users' ? userIds : [],
      senderUid: authCheck.user?.uid ?? null,
      senderEmail: authCheck.user?.email ?? null,
      recipientCount: targetChurchIds.length,
      deliveryStatus: 'sending',
      createdAt: FieldValue.serverTimestamp(),
    })

    // Fan out: one in-app notification per targeted church (existing
    // notification bell reads churches/{churchId}/notifications) + a
    // best-effort email to each church's owner. Failures are isolated per
    // church so one bad write/email never blocks the rest.
    let delivered = 0
    let failed = 0
    await Promise.all(
      targetChurchIds.map(async (churchId) => {
        try {
          await adminDb.collection('churches').doc(churchId).collection('notifications').add({
            type: 'announcement',
            title: `📢 ${title}`,
            description: message.slice(0, 300),
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          })
          delivered++

          const churchSnap = await adminDb.collection('churches').doc(churchId).get()
          const ownerEmail = churchSnap.exists ? churchSnap.data()?.ownerEmail ?? churchSnap.data()?.email : null
          if (ownerEmail) {
            await sendSupportEmailNotification({
              to: ownerEmail,
              subject: `📢 ${title}`,
              ticketId: announcementRef.id,
              churchName: churchSnap.data()?.name ?? 'Church Tenant',
              message,
            }).catch(() => null)
          }
        } catch (err) {
          failed++
          console.error(`[ANNOUNCEMENTS] Delivery failed for church ${churchId}:`, err)
        }
      })
    )

    const deliveryStatus = failed === 0 ? 'sent' : delivered === 0 ? 'failed' : 'partial'
    await announcementRef.update({ deliveryStatus, deliveredCount: delivered, failedCount: failed })

    return NextResponse.json({
      success: true,
      announcementId: announcementRef.id,
      recipientCount: targetChurchIds.length,
      delivered,
      failed,
    })
  } catch (err: any) {
    console.error('[API_ADMIN_ANNOUNCEMENTS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to send announcement' }, { status: 500 })
  }
}
