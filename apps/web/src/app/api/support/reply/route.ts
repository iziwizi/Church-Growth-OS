import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendSupportEmailNotification } from '@/lib/email/resend'

const PLATFORM_SUPPORT_EMAIL = process.env.PLATFORM_SUPPORT_EMAIL ?? 'admin@mujteknify.com'

/**
 * POST /api/support/reply
 * Church-side reply on a support ticket. (Super Admin replies continue to
 * go through PATCH /api/admin/support, which writes to the same
 * `platformSupportTickets` document, so both directions of the
 * conversation land in one place.)
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`support-reply:${authCheck.uid}`, 20, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many replies submitted. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { ticketId, message } = body as { ticketId?: string; message?: string }

    if (!ticketId || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'ticketId and message are required.' }, { status: 400 })
    }

    const ticketRef = adminDb.collection('platformSupportTickets').doc(ticketId)
    const ticketDoc = await ticketRef.get()
    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    }
    const ticketData = ticketDoc.data()!

    if (authCheck.role !== 'super_admin' && ticketData.churchId !== authCheck.churchId) {
      return NextResponse.json({ error: 'You are not authorized to reply to this ticket.' }, { status: 403 })
    }

    const trimmedMessage = message.trim().slice(0, 5000)
    const nextStatus = ticketData.status === 'closed' || ticketData.status === 'resolved' ? 'open' : 'waiting'

    await ticketRef.update({
      replies: FieldValue.arrayUnion({
        message: trimmedMessage,
        sender: ticketData.churchName ?? 'Church Admin',
        senderEmail: authCheck.email ?? null,
        createdAt: new Date().toISOString(),
      }),
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Best-effort email to the platform support inbox — never blocks the reply.
    sendSupportEmailNotification({
      to: PLATFORM_SUPPORT_EMAIL,
      subject: `[Ticket Reply] ${ticketData.subject ?? 'Support Ticket'}`,
      ticketId,
      churchName: ticketData.churchName ?? 'Church Tenant',
      message: `${authCheck.email} replied:\n\n${trimmedMessage}`,
    }).catch(() => null)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API_SUPPORT_REPLY] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to send reply.' }, { status: 500 })
  }
}
