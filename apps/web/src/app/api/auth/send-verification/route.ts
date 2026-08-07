import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/auth/send-verification
 * 
 * Generates a Firebase email verification link (server-side via Admin SDK),
 * then sends a formatted email via Resend.
 *
 * FULLY INSTRUMENTED FOR VERIFICATION DEBUGGING.
 */
export async function POST(req: NextRequest) {
  console.log('====================================================')
  console.log('[VERIFICATION_DEBUG] POST /api/auth/send-verification API endpoint called')
  console.log('====================================================')

  try {
    const body = await req.json().catch((jsonErr) => {
      console.error('[VERIFICATION_DEBUG] Failed to parse request JSON body:', jsonErr)
      return {}
    })

    const { email, fullName } = body
    console.log('[VERIFICATION_DEBUG] Request payload received:', { email, fullName })

    if (!email || typeof email !== 'string') {
      console.error('[VERIFICATION_DEBUG] Validation Error: Email is missing or invalid.')
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    console.log('[VERIFICATION_DEBUG] Checking RESEND_API_KEY in env:', resendApiKey ? `Present (length: ${resendApiKey.length}, prefix: ${resendApiKey.slice(0, 5)}...)` : 'MISSING / UNDEFINED!')

    if (!resendApiKey || resendApiKey.includes('REPLACE_WITH')) {
      console.error('[VERIFICATION_DEBUG] CRITICAL: RESEND_API_KEY is not configured in environment variables or is set to placeholder!')
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in environment variables.' },
        { status: 500 }
      )
    }

    // 1. Generate Firebase email verification link server-side
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const actionCodeSettings = {
      url: `${appUrl}/verify-email`,
      handleCodeInApp: false,
    }
    console.log('[VERIFICATION_DEBUG] ActionCodeSettings continueUrl:', actionCodeSettings.url)

    let verificationLink: string
    try {
      console.log('[VERIFICATION_DEBUG] Calling Firebase Admin SDK generateEmailVerificationLink for:', email)
      verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings)
      console.log('[VERIFICATION_DEBUG] Firebase Admin generateEmailVerificationLink SUCCESS!')
      console.log('[VERIFICATION_DEBUG] Generated Verification Link:', verificationLink)
    } catch (adminErr: any) {
      console.error('[VERIFICATION_DEBUG] Firebase Admin generateEmailVerificationLink FAILED!')
      console.error('  error object :', adminErr)
      console.error('  error.code   :', adminErr?.code)
      console.error('  error.message:', adminErr?.message)
      console.error('  error.stack  :', adminErr?.stack)
      return NextResponse.json(
        { error: `Could not generate verification link: ${adminErr?.message ?? 'Unknown Firebase Admin error'}` },
        { status: 500 }
      )
    }

    // 2. Build HTML template
    const name = fullName ?? 'Pastor'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    console.log('[VERIFICATION_DEBUG] Using sender email (RESEND_FROM_EMAIL):', fromEmail)

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
          <h2>Verify Your Email</h2>
          <p>Hi ${name}, welcome to Church Growth OS!</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationLink}" style="background:#4f46e5;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size:12px;color:#71717a;">Or copy this link: ${verificationLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    // 3. Send via Resend API
    console.log('[VERIFICATION_DEBUG] Dispatching HTTP POST to Resend API (https://api.resend.com/emails)...')
    console.log('[VERIFICATION_DEBUG] Resend Payload:', {
      from: `Church Growth OS <${fromEmail}>`,
      to: [email],
      subject: '✅ Verify Your Email — Church Growth OS',
    })

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
    console.log('[VERIFICATION_DEBUG] Resend HTTP Status Code:', resendStatus)
    console.log('[VERIFICATION_DEBUG] Resend Response OK:', resendOk)

    const resendText = await resendResponse.text()
    console.log('[VERIFICATION_DEBUG] Resend Raw Response Body:', resendText)

    let resendData: any = {}
    try {
      resendData = JSON.parse(resendText)
    } catch {
      resendData = { raw: resendText }
    }

    if (!resendOk) {
      console.error('====================================================')
      console.error('[VERIFICATION_DEBUG] RESEND PROVIDER REJECTED EMAIL!')
      console.error('  HTTP Status  :', resendStatus)
      console.error('  Response Body:', resendData)
      console.error('====================================================')
      return NextResponse.json(
        {
          error: `Resend API rejected email (Status ${resendStatus}): ${resendData?.message ?? resendText}`,
          resendStatus,
          resendData,
        },
        { status: 500 }
      )
    }

    console.log('====================================================')
    console.log('[VERIFICATION_DEBUG] RESEND EMAIL DELIVERED SUCCESSFULLY!')
    console.log('  Resend Message ID:', resendData?.id)
    console.log('====================================================')

    return NextResponse.json({
      success: true,
      messageId: resendData?.id,
      resendStatus,
      resendData,
    })
  } catch (err: any) {
    console.error('====================================================')
    console.error('[VERIFICATION_DEBUG] UNHANDLED EXCEPTION IN API ROUTE!')
    console.error('  File   : apps/web/src/app/api/auth/send-verification/route.ts')
    console.error('  Error  :', err)
    console.error('  Code   :', err?.code)
    console.error('  Message:', err?.message)
    console.error('  Stack  :', err?.stack)
    console.error('====================================================')

    return NextResponse.json(
      { error: err?.message ?? 'Unexpected server error during verification email send', stack: err?.stack },
      { status: 500 }
    )
  }
}
