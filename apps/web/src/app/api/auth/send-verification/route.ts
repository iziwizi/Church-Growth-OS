import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin-sdk'
import { getAppUrl } from '@/lib/config/app-url'
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit'

/**
 * POST /api/auth/send-verification
 *
 * Generates a Firebase email verification link (server-side via Admin SDK),
 * then sends a formatted email via Resend. Returns a truthful `status` so
 * the client never claims "email sent" unless Resend actually accepted the
 * send — and applies its own cooldown so repeated resend clicks fail fast
 * with a clear message instead of silently falling through to Firebase's
 * own per-user rate limiter (which produced the confusing generic
 * "too many requests" error previously).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, fullName } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ status: 'invalid_request', error: 'Email is required.' }, { status: 400 })
    }

    // Per-email cooldown (60s) and a per-IP ceiling to blunt abuse — this
    // route sends real email via a paid, reputation-sensitive domain.
    const emailLimit = checkRateLimit(`verify-email:${email.toLowerCase()}`, 1, 60_000)
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          status: 'rate_limited',
          error: `Please wait ${emailLimit.retryAfterSeconds}s before requesting another verification email.`,
          retryAfterSeconds: emailLimit.retryAfterSeconds,
        },
        { status: 429 }
      )
    }
    const ipLimit = checkRateLimit(`verify-email-ip:${getClientIp(req)}`, 10, 60 * 60_000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { status: 'rate_limited', error: 'Too many verification requests from this network. Please try again later.', retryAfterSeconds: ipLimit.retryAfterSeconds },
        { status: 429 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey || resendApiKey.includes('REPLACE_WITH')) {
      return NextResponse.json(
        { status: 'config_error', error: 'Email provider is not configured on the server.' },
        { status: 500 }
      )
    }

    // Already-verified accounts should not be told "we sent you an email".
    try {
      const existingUser = await adminAuth.getUserByEmail(email)
      if (existingUser.emailVerified) {
        return NextResponse.json({ status: 'already_verified', success: true, message: 'This email address is already verified.' })
      }
    } catch {
      // getUserByEmail throws if the user doesn't exist yet (e.g. called
      // mid-registration) — fall through and attempt to generate the link.
    }

    // 1. Generate Firebase email verification link server-side pointing to canonical production URL
    const appUrl = getAppUrl(req)
    const actionCodeSettings = {
      url: `${appUrl}/verify-email`,
      handleCodeInApp: false,
    }

    let verificationLink: string
    try {
      verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings)
    } catch (adminErr: any) {
      console.error('[SEND_VERIFICATION] generateEmailVerificationLink failed:', adminErr?.code, adminErr?.message)
      return NextResponse.json(
        { status: 'config_error', error: `Could not generate verification link: ${adminErr?.message ?? 'Unknown Firebase Admin error'}` },
        { status: 500 }
      )
    }

    // 2. Build HTML template
    const name = fullName ?? 'Pastor'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com'

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Verify Your Email — Church Growth OS</title></head>
<body style="margin:0;padding:0;background:#0f0f10;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;border:1px solid #27272a;">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#6d28d9);padding:40px;text-align:center;color:#fff;font-size:24px;font-weight:bold;">Church Growth OS</td></tr>
        <tr><td style="padding:40px;color:#f4f4f5;">
          <h2>Verify Your Email Address</h2>
          <p>Hi ${name}, welcome to Church Growth OS!</p>
          <p>Please click the button below to verify your email address and continue setting up your church account:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationLink}" style="background:#4f46e5;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size:12px;color:#71717a;">Or copy and paste this link in your browser: ${verificationLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    // 3. Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Church Growth OS <${fromEmail}>`,
        to: [email],
        subject: '✅ Verify Your Email — Church Growth OS',
        html: emailHtml,
      }),
    })

    const resendStatus = resendResponse.status
    const resendOk = resendResponse.ok
    const resendText = await resendResponse.text()

    let resendData: any = {}
    try {
      resendData = JSON.parse(resendText)
    } catch {
      resendData = { raw: resendText }
    }

    if (!resendOk) {
      console.error('[SEND_VERIFICATION] Resend rejected the send:', resendStatus, resendData)
      return NextResponse.json(
        {
          status: 'provider_error',
          error: `Email provider rejected the request (${resendStatus}): ${resendData?.message ?? resendText}`,
          resendStatus,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'sent',
      message: 'Verification email accepted for delivery by the email provider.',
      messageId: resendData?.id,
    })
  } catch (err: any) {
    console.error('[SEND_VERIFICATION] Unexpected error:', err)
    return NextResponse.json(
      { status: 'provider_error', error: err?.message ?? 'Unexpected server error while sending verification email.' },
      { status: 500 }
    )
  }
}
