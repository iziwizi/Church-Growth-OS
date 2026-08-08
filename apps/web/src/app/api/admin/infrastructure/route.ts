import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Mask a sensitive key for secure display in the UI.
 */
function maskSecret(val?: string): string {
  if (!val || val.length < 8) return val ? '••••••••' : ''
  return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`
}

/**
 * GET /api/admin/infrastructure - Reads system configuration with masked secrets
 * POST /api/admin/infrastructure - Saves platform secrets server-side into system/infrastructure
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    // Fallback to environment variables if not yet explicitly saved in Firestore
    const config = {
      deepseekKey: data?.deepseekKey || (process.env.DEEPSEEK_API_KEY ? maskSecret(process.env.DEEPSEEK_API_KEY) : ''),
      claudeKey: data?.claudeKey || (process.env.ANTHROPIC_API_KEY ? maskSecret(process.env.ANTHROPIC_API_KEY) : ''),
      openaiKey: data?.openaiKey || (process.env.OPENAI_API_KEY ? maskSecret(process.env.OPENAI_API_KEY) : ''),
      geminiKey: data?.geminiKey || (process.env.GEMINI_API_KEY ? maskSecret(process.env.GEMINI_API_KEY) : ''),
      openrouterKey: data?.openrouterKey || (process.env.OPENROUTER_API_KEY ? maskSecret(process.env.OPENROUTER_API_KEY) : ''),
      cloudinaryCloudName: data?.cloudinaryCloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      cloudinaryApiKey: data?.cloudinaryApiKey || (process.env.CLOUDINARY_API_KEY ? maskSecret(process.env.CLOUDINARY_API_KEY) : ''),
      cloudinaryApiSecret: data?.cloudinaryApiSecret || (process.env.CLOUDINARY_API_SECRET ? maskSecret(process.env.CLOUDINARY_API_SECRET) : ''),
      resendKey: data?.resendKey || (process.env.RESEND_API_KEY ? maskSecret(process.env.RESEND_API_KEY) : ''),
      metaWhatsappToken: data?.metaWhatsappToken || (process.env.META_WHATSAPP_TOKEN ? maskSecret(process.env.META_WHATSAPP_TOKEN) : ''),
      metaWhatsappPhoneId: data?.metaWhatsappPhoneId || process.env.META_WHATSAPP_PHONE_ID || '',
      termiiKey: data?.termiiKey || (process.env.TERMII_API_KEY ? maskSecret(process.env.TERMII_API_KEY) : ''),
      paystackSecret: data?.paystackSecret || (process.env.PAYSTACK_SECRET_KEY ? maskSecret(process.env.PAYSTACK_SECRET_KEY) : ''),
      flutterwaveSecret: data?.flutterwaveSecret || (process.env.FLUTTERWAVE_SECRET_KEY ? maskSecret(process.env.FLUTTERWAVE_SECRET_KEY) : ''),
      stripeSecret: data?.stripeSecret || (process.env.STRIPE_SECRET_KEY ? maskSecret(process.env.STRIPE_SECRET_KEY) : ''),
    }

    return NextResponse.json({ success: true, config })
  } catch (err: any) {
    console.error('[API_ADMIN_INFRASTRUCTURE] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load infrastructure settings' }, { status: 500 })
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

    // Only overwrite keys if not masked (e.g. doesn't contain ••••)
    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    const fields = [
      'deepseekKey', 'claudeKey', 'openaiKey', 'geminiKey', 'openrouterKey',
      'cloudinaryCloudName', 'cloudinaryApiKey', 'cloudinaryApiSecret',
      'resendKey', 'metaWhatsappToken', 'metaWhatsappPhoneId', 'termiiKey',
      'paystackSecret', 'flutterwaveSecret', 'stripeSecret',
    ]

    fields.forEach((field) => {
      const incomingVal = body[field]
      if (typeof incomingVal === 'string') {
        const trimmed = incomingVal.trim()
        if (trimmed && !trimmed.includes('••••')) {
          updatePayload[field] = trimmed
        } else if (existingData?.[field]) {
          updatePayload[field] = existingData[field]
        }
      }
    })

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Infrastructure API secrets saved securely' })
  } catch (err: any) {
    console.error('[API_ADMIN_INFRASTRUCTURE] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save infrastructure settings' }, { status: 500 })
  }
}
