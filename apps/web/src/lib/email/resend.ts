/**
 * Resend Email Dispatch Service
 * Dispatches transactional notifications for platform support tickets and system alerts.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
// Must match the domain actually verified in Resend (see RESEND_FROM_EMAIL
// used by /api/auth/send-verification) — a mismatched sending domain here
// was silently failing deliverability for support notifications.
const FROM_EMAIL = `Church Growth OS <${process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com'}>`

export async function sendSupportEmailNotification(options: {
  to: string
  subject: string
  ticketId: string
  churchName: string
  message: string
  actionUrl?: string
}) {
  if (!RESEND_API_KEY) {
    console.log('[Resend Simulation] Email to:', options.to, 'Subject:', options.subject)
    return { success: true, simulated: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [options.to],
        subject: options.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #6366f1; font-size: 20px;">${options.subject}</h2>
            <p><strong>Church:</strong> ${options.churchName}</p>
            <p><strong>Ticket ID:</strong> ${options.ticketId}</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
            <div style="background: #fafafa; padding: 16px; border-radius: 8px; font-size: 14px; color: #3f3f46;">
              ${options.message.replace(/\n/g, '<br/>')}
            </div>
            <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px; text-align: center;">
              Powered by <strong>Church Growth OS</strong> — A Product of <a href="https://mujteknify.com" style="color: #6366f1;">MUJTEKNIFY LIMITED</a>
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      throw new Error(`Resend error: ${res.statusText}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Support email dispatch failed:', err)
    return { success: false, error: err }
  }
}
