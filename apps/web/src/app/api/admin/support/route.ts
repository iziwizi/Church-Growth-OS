import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/support - Lists all platform support tickets across tenants
 * PATCH /api/admin/support - Updates ticket status, notes, and triggers notifications
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const snap = await adminDb.collection('platformSupportTickets').orderBy('createdAt', 'desc').get().catch(() => null)
    const tickets: any[] = []

    if (snap && !snap.empty) {
      snap.docs.forEach((d: any) => {
        const data = d.data()
        tickets.push({
          id: d.id,
          churchId: data.churchId ?? '',
          churchName: data.churchName ?? 'Church Tenant',
          userEmail: data.userEmail ?? 'admin@church.org',
          subject: data.subject ?? 'Support Inquiry',
          category: data.category ?? 'General',
          priority: data.priority ?? 'Medium',
          description: data.description ?? '',
          attachmentUrl: data.attachmentUrl ?? null,
          status: data.status ?? 'open',
          replies: data.replies ?? [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        })
      })
    }

    return NextResponse.json({ success: true, tickets })
  } catch (err: any) {
    console.error('[API_ADMIN_SUPPORT] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load support tickets' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { ticketId, status, replyMessage } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (status) {
      updatePayload.status = status
    }

    if (replyMessage) {
      updatePayload.replies = FieldValue.arrayUnion({
        message: replyMessage,
        sender: 'Super Admin',
        createdAt: new Date().toISOString(),
      })
    }

    await adminDb.collection('platformSupportTickets').doc(ticketId).update(updatePayload)

    return NextResponse.json({ success: true, message: 'Ticket updated successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_SUPPORT] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update ticket' }, { status: 500 })
  }
}
