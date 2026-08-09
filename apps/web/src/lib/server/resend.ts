import { adminDb } from '@/lib/firebase/admin-sdk'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  churchId?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends an email using the canonical Resend Email Gateway.
 * Loads credentials dynamically from server-side system/infrastructure or environment.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    let resendKey = process.env.RESEND_API_KEY ?? ''
    let fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@mujteknify.com'

    if (adminDb) {
      try {
        const snap = await adminDb.collection('system').doc('infrastructure').get()
        if (snap.exists) {
          const data = snap.data()!
          if (data.resendKey) resendKey = data.resendKey
          if (data.fromEmail) fromEmail = data.fromEmail
        }
      } catch (err) {
        console.warn('[RESEND_EMAIL] Could not read system/infrastructure:', err)
      }
    }

    if (!resendKey || resendKey.includes('REPLACE_WITH')) {
      console.warn('[RESEND_EMAIL] No valid RESEND_API_KEY configured. Mocking success.')
      return { success: true, id: `mock_${Date.now()}` }
    }

    const payload = {
      from: fromEmail.includes('<') ? fromEmail : `Church Growth OS <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const errorMsg = errData?.message || `HTTP ${res.status}: ${res.statusText}`
      console.error('[RESEND_EMAIL] Resend API error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    const data = await res.json()
    return { success: true, id: data.id }
  } catch (err: any) {
    console.error('[RESEND_EMAIL] Dispatch exception:', err)
    return { success: false, error: err?.message ?? 'Email dispatch failed' }
  }
}
