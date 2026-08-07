import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/auth/send-verification
 * 
 * Generates a Firebase email verification link (server-side via Admin SDK),
 * then sends a beautifully formatted email via Resend.
 * 
 * This bypasses Firebase's own email infrastructure (which has poor
 * deliverability and silent quota limits) in favour of Resend's
 * reliable SMTP delivery.
 *
 * Body: { email: string; fullName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, fullName } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('[send-verification] RESEND_API_KEY is not set in environment variables.')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // 1. Generate a Firebase email verification link server-side
    //    The continueUrl tells Firebase where to redirect after the user clicks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const actionCodeSettings = {
      url: `${appUrl}/verify-email`,
      handleCodeInApp: false,
    }

    let verificationLink: string
    try {
      verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings)
      console.log('[send-verification] Firebase verification link generated for:', email)
    } catch (adminErr: any) {
      console.error('[send-verification] Firebase Admin generateEmailVerificationLink error:')
      console.error('  code   :', adminErr?.code)
      console.error('  message:', adminErr?.message)
      return NextResponse.json(
        { error: `Could not generate verification link: ${adminErr?.message ?? 'Unknown error'}` },
        { status: 500 }
      )
    }

    // 2. Build beautiful HTML email
    const name = fullName ?? 'Pastor'
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify Your Email — Church Growth OS</title>
</head>
<body style="margin:0;padding:0;background:#0f0f10;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;overflow:hidden;border:1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#6d28d9 100%);padding:40px 48px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⛪ Church Growth OS</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px;">Ministry Intelligence Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#f4f4f5;line-height:1.3;">
                Verify Your Email Address
              </h1>
              <p style="margin:0 0 12px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Hi ${name},
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Welcome to <strong style="color:#f4f4f5;">Church Growth OS</strong> — the AI-powered platform 
                built to help your ministry grow. Please verify your email address to activate your account 
                and start your 14-day free trial.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${verificationLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6d28d9);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
                  ✓ Verify My Email Address
                </a>
              </div>

              <!-- Security note -->
              <div style="background:#27272a;border-radius:12px;padding:20px;margin-bottom:32px;">
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
                  <strong style="color:#a1a1aa;">⚠️ Security Note:</strong> This link expires in 24 hours. 
                  If you did not create a Church Growth OS account, please ignore this email.
                </p>
              </div>

              <!-- What's next -->
              <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#f4f4f5;">What happens next?</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#a1a1aa;">✅ Verify email → Complete church setup → Dashboard</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#a1a1aa;">🤖 AI-powered member follow-up</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#a1a1aa;">📊 Real-time ministry analytics</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#a1a1aa;">💬 WhatsApp, Email &amp; SMS automation</td>
                </tr>
              </table>

              <!-- Link fallback -->
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #27272a;">
                <p style="margin:0 0 8px;font-size:12px;color:#52525b;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:11px;color:#4f46e5;word-break:break-all;">
                  ${verificationLink}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#09090b;padding:24px 48px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
                © 2026 MUJTEKNIFY LIMITED · Church Growth OS
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#3f3f46;">
                You are receiving this because you signed up at churchgrowth.os
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // 3. Send via Resend HTTP API (no SDK package required)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
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

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('[send-verification] Resend API error:', resendData)
      return NextResponse.json(
        { error: `Email delivery failed: ${resendData?.message ?? 'Resend error'}` },
        { status: 500 }
      )
    }

    console.log('[send-verification] Email sent successfully via Resend. ID:', resendData?.id)
    return NextResponse.json({ success: true, messageId: resendData?.id })
  } catch (err: any) {
    console.error('[send-verification] Unexpected error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected server error' },
      { status: 500 }
    )
  }
}
