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

    const ticketRef = adminDb.collection('platformSupportTickets').doc(ticketId)
    const ticketDoc = await ticketRef.get()
    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticketData = ticketDoc.data()!
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

      // 1. Notify church tenant in Firestore
      if (ticketData.churchId) {
        await adminDb
          .collection('churches')
          .doc(ticketData.churchId)
          .collection('notifications')
          .add({
            type: 'SUPPORT_TICKET_REPLY',
            title: `Support Ticket Update: ${ticketData.subject || 'Inquiry'}`,
            message: `Super Admin replied: "${replyMessage.slice(0, 120)}..."`,
            ticketId,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          })
          .catch(() => null)
      }

      // 2. Dispatch email notification via Resend if configured
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey && ticketData.userEmail) {
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com'
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Church Growth OS Support <${fromEmail}>`,
            to: [ticketData.userEmail],
            subject: `💬 Update on your support ticket: ${ticketData.subject || 'Support Ticket'}`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; background: #0f0f10; color: #f4f4f5; border-radius: 12px;">
                <h3 style="color: #6366f1;">Support Team Response</h3>
                <p>Hello ${ticketData.churchName || 'Church Admin'},</p>
                <p>A support specialist has responded to your ticket <strong>"${ticketData.subject}"</strong>:</p>
                <blockquote style="border-left: 3px solid #6366f1; margin: 16px 0; padding-left: 12px; color: #e4e4e7;">
                  ${replyMessage}
                </blockquote>
                <p style="font-size: 12px; color: #71717a;">Log in to your Church Growth OS dashboard to view the full thread.</p>
              </div>
            `,
          }),
        }).catch(() => null)
      }
    }

    await ticketRef.update(updatePayload)

    return NextResponse.json({ success: true, message: 'Ticket updated successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_SUPPORT] PATCH error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to update ticket' }, { status: 500 })
  }
}
