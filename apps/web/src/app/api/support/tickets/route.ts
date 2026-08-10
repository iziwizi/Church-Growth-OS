import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendSupportEmailNotification } from '@/lib/email/resend'

const PLATFORM_SUPPORT_EMAIL = process.env.PLATFORM_SUPPORT_EMAIL ?? 'admin@mujteknify.com'

/**
 * POST /api/support/tickets
 * Creates a support ticket for the authenticated church tenant. This is the
 * single write path for ticket creation — `platformSupportTickets` is the
 * one canonical collection both the Church Admin and Super Admin consoles
 * read from (previously two unlinked documents were created per ticket,
 * which is why Super Admin replies never reached the Church Admin).
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`support-ticket-create:${authCheck.uid}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many tickets submitted. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { churchId, churchName, subject, category, priority, description, attachmentUrl } = body

    if (authCheck.role !== 'super_admin' && churchId !== authCheck.churchId) {
      return NextResponse.json({ error: 'churchId does not match the authenticated user.' }, { status: 403 })
    }
    if (!churchId || typeof subject !== 'string' || !subject.trim() || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'churchId, subject, and description are required.' }, { status: 400 })
    }

    const ticketRef = adminDb.collection('platformSupportTickets').doc()
    await ticketRef.set({
      churchId,
      churchName: churchName ?? 'Church Tenant',
      userId: authCheck.uid,
      userEmail: authCheck.email ?? 'unknown@church.org',
      subject: subject.trim().slice(0, 200),
      category: category ?? 'Technical',
      priority: priority ?? 'Medium',
      description: description.trim().slice(0, 5000),
      attachmentUrl: attachmentUrl ?? null,
      status: 'open',
      replies: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Best-effort notification to the platform support inbox — failure here
    // must never fail the ticket creation itself.
    sendSupportEmailNotification({
      to: PLATFORM_SUPPORT_EMAIL,
      subject: `[New Ticket] ${subject.trim()}`,
      ticketId: ticketRef.id,
      churchName: churchName ?? 'Church Tenant',
      message: `Category: ${category ?? 'Technical'}\nPriority: ${priority ?? 'Medium'}\nFrom: ${authCheck.email}\n\n${description.trim()}`,
    }).catch(() => null)

    return NextResponse.json({ success: true, ticketId: ticketRef.id })
  } catch (err: any) {
    console.error('[API_SUPPORT_TICKETS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to create support ticket.' }, { status: 500 })
  }
}
