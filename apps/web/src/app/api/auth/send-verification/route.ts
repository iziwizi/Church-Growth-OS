import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin-sdk'
import { getAppUrl } from '@/lib/config/app-url'

/**
 * POST /api/auth/send-verification
 * 
 * Generates a Firebase email verification link (server-side via Admin SDK),
 * then sends a formatted email via Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, fullName } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey || resendApiKey.includes('REPLACE_WITH')) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in environment variables.' },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: `Could not generate verification link: ${adminErr?.message ?? 'Unknown Firebase Admin error'}` },
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
      return NextResponse.json(
        {
          status: 'REQUEST_FAILED',
          error: `Resend API rejected email (Status ${resendStatus}): ${resendData?.message ?? resendText}`,
          resendStatus,
          resendData,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'REQUEST_ACCEPTED',
      message: 'Verification email accepted for delivery.',
      messageId: resendData?.id,
      resendStatus,
      resendData,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected server error during verification email send', stack: err?.stack },
      { status: 500 }
    )
  }
}
