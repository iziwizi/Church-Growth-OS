import { NextResponse } from 'next/server'
import { sendSupportEmailNotification } from '@/lib/email/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, subject, ticketId, churchName, message } = body

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const result = await sendSupportEmailNotification({
      to,
      subject,
      ticketId: ticketId ?? 'N/A',
      churchName: churchName ?? 'Church Growth OS Tenant',
      message,
    })

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process email notification' }, { status: 500 })
  }
}
