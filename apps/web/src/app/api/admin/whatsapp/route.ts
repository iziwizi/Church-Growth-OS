import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

function maskSecret(val?: string): string {
  if (!val || val.length < 8) return val ? '••••••••' : ''
  return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`
}

/**
 * GET /api/admin/whatsapp - Reads WhatsApp gateway settings
 * POST /api/admin/whatsapp - Saves Meta / Twilio WhatsApp settings securely server-side
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const metaToken = data?.metaWhatsappToken || process.env.META_WHATSAPP_TOKEN || ''
    const twilioToken = data?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || ''

    return NextResponse.json({
      success: true,
      config: {
        whatsappProvider: data?.whatsappProvider || 'meta',
        metaWhatsappToken: maskSecret(metaToken),
        metaWhatsappPhoneId: data?.metaWhatsappPhoneId || process.env.META_WHATSAPP_PHONE_ID || '',
        metaWhatsappWabaId: data?.metaWhatsappWabaId || process.env.META_WHATSAPP_WABA_ID || '',
        metaWebhookToken: data?.metaWebhookToken || process.env.META_WEBHOOK_TOKEN || '',
        twilioAccountSid: data?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '',
        twilioAuthToken: maskSecret(twilioToken),
        twilioWhatsappSender: data?.twilioWhatsappSender || 'whatsapp:+14155238886',
      },
    })
  } catch (err: any) {
    console.error('[API_ADMIN_WHATSAPP] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load WhatsApp settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const updatePayload: Record<string, any> = {
      whatsappProvider: body.whatsappProvider || 'meta',
      metaWhatsappPhoneId: body.metaWhatsappPhoneId?.trim() || existingData?.metaWhatsappPhoneId || '',
      metaWhatsappWabaId: body.metaWhatsappWabaId?.trim() || existingData?.metaWhatsappWabaId || '',
      metaWebhookToken: body.metaWebhookToken?.trim() || existingData?.metaWebhookToken || '',
      twilioAccountSid: body.twilioAccountSid?.trim() || existingData?.twilioAccountSid || '',
      twilioWhatsappSender: body.twilioWhatsappSender?.trim() || existingData?.twilioWhatsappSender || 'whatsapp:+14155238886',
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (body.metaWhatsappToken && typeof body.metaWhatsappToken === 'string' && !body.metaWhatsappToken.includes('••••')) {
      updatePayload.metaWhatsappToken = body.metaWhatsappToken.trim()
    }
    if (body.twilioAuthToken && typeof body.twilioAuthToken === 'string' && !body.twilioAuthToken.includes('••••')) {
      updatePayload.twilioAuthToken = body.twilioAuthToken.trim()
    }

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'WhatsApp gateway settings saved securely' })
  } catch (err: any) {
    console.error('[API_ADMIN_WHATSAPP] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save WhatsApp settings' }, { status: 500 })
  }
}
