import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'

/**
 * POST /api/auth/test-email
 *
 * Super Admin diagnostic endpoint to verify Resend email dispatch.
 * Sends a test email using the verified `mujteknify.com` domain.
 * Accepts: { to?: string, recipient?: string, email?: string }
 *
 * SECURITY: this was previously unauthenticated and accepted an arbitrary
 * destination, making it an open relay against the platform's paid,
 * reputation-sensitive Resend account — a likely contributor to the
 * verification-email deliverability problem (see docs/PRODUCTION_ENGINEERING_AUDIT.md §6).
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error ?? 'Super Admin authorization required.' }, { status: 403 })
  }

  const rateLimit = checkRateLimit(`test-email:${authCheck.user?.uid ?? 'admin'}`, 5, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many test emails sent. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const rawTo = body.to || body.recipient || body.email
    const to = (typeof rawTo === 'string' && rawTo.trim()) ? rawTo.trim() : 'mujteknify@gmail.com'

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY is not configured in server environment.' },
        { status: 500 }
      )
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com'
    console.log('[TEST_EMAIL] Dispatching test email via Resend to:', to, 'from:', fromEmail)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Church Growth OS <${fromEmail}>`,
        to: [to],
        subject: '🧪 Resend Email Delivery Test — Church Growth OS',
        html: `
          <div style="font-family: sans-serif; padding: 24px; background: #0f0f10; color: #f4f4f5; border-radius: 12px;">
            <h2 style="color: #6366f1;">Church Growth OS — Delivery Test</h2>
            <p>If you are reading this email, your Resend integration with verified domain <strong>${fromEmail}</strong> is working perfectly!</p>
            <p style="font-size: 12px; color: #71717a;">Dispatched to: ${to}</p>
            <p style="font-size: 12px; color: #71717a;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    })

    const status = resendResponse.status
    const data = await resendResponse.json().catch(() => ({}))
    console.log('[TEST_EMAIL] Resend response status:', status, 'data:', data)

    if (!resendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 'REQUEST_FAILED',
          httpStatus: status,
          error: data?.message ?? 'Resend API error',
          details: data,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'REQUEST_ACCEPTED',
      httpStatus: status,
      emailId: data?.id,
      from: fromEmail,
      to,
      message: `✓ Test email dispatched successfully to ${to} via Resend.`,
    })
  } catch (err: any) {
    console.error('[TEST_EMAIL] Unexpected server error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Internal Server Error' },
      { status: 500 }
    )
  }
}
