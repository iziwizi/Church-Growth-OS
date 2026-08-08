import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { provider, recipientPhone, metaPhoneId, metaToken, twilioAccountSid, twilioAuthToken, twilioSender } = await req.json()

    if (!recipientPhone) {
      return NextResponse.json({ error: 'Recipient phone number is required.' }, { status: 400 })
    }

    if (provider === 'meta') {
      if (!metaPhoneId || !metaToken) {
        return NextResponse.json({ error: 'Meta Phone Number ID and Access Token are required.' }, { status: 400 })
      }

      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { body: '🎉 Church Growth OS WhatsApp Gateway test message! Your integration is active.' },
        }),
      })

      const data = await res.json()
      if (res.ok && data.messages?.[0]?.id) {
        return NextResponse.json({ success: true, messageId: data.messages[0].id })
      }
      return NextResponse.json({ success: false, error: data.error?.message ?? 'Meta API error' }, { status: 400 })
    } else {
      if (!twilioAccountSid || !twilioAuthToken) {
        return NextResponse.json({ error: 'Twilio Account SID and Auth Token are required.' }, { status: 400 })
      }

      const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')
      const bodyParams = new URLSearchParams()
      bodyParams.append('From', twilioSender || 'whatsapp:+14155238886')
      bodyParams.append('To', recipientPhone.startsWith('whatsapp:') ? recipientPhone : `whatsapp:${recipientPhone}`)
      bodyParams.append('Body', '🎉 Church Growth OS Twilio WhatsApp Gateway test message! Your integration is active.')

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      })

      const data = await res.json()
      if (res.ok && data.sid) {
        return NextResponse.json({ success: true, messageId: data.sid })
      }
      return NextResponse.json({ success: false, error: data.message ?? 'Twilio API error' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'WhatsApp test send failed.' }, { status: 500 })
  }
}
