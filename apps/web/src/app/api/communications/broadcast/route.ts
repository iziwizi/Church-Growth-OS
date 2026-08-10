import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { requireChurchFeature, type MachineFeatureKey } from '@/lib/server/feature-access'
import { CommunicationRouter, type TenantProviderConfig } from '@church-growth-os/communication'

type Channel = 'whatsapp' | 'email' | 'sms'
const ALL_CHANNELS: Channel[] = ['whatsapp', 'email', 'sms']
const CHANNEL_FEATURE: Record<Channel, MachineFeatureKey> = { whatsapp: 'whatsapp', email: 'email', sms: 'sms' }

interface Recipient {
  name?: string
  phone?: string
  email?: string
}

/**
 * POST /api/communications/broadcast
 *
 * The real send path for the Communications composer. The previous
 * implementation never called this or any API route at all — the
 * "Dispatch Broadcast Now" button wrote a Firestore record with
 * `status: 'sent'` hardcoded and no provider was ever contacted
 * (docs/PRODUCTION_ENGINEERING_AUDIT.md §9). This route:
 *
 *  - accepts one or more channels per request (WhatsApp, Email, SMS, or
 *    any combination) so a single broadcast can go out multi-channel
 *  - gates each channel independently through the unified feature-access
 *    check (Global Flag AND Plan Entitlement AND Role) before dispatching
 *  - isolates failures per channel — one broken provider never blocks the
 *    others — and records real per-channel delivery counts
 *  - never claims "sent" for a channel that wasn't actually dispatched
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid || !authCheck.churchId) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`broadcast:${authCheck.churchId}`, 20, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many broadcasts sent recently. Please wait a moment.' }, { status: 429 })
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database service is currently initializing.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const churchId = body.churchId as string
    const requestedChannels = (Array.isArray(body.channels) ? body.channels : [body.channel]).filter((c: unknown): c is Channel =>
      ALL_CHANNELS.includes(c as Channel)
    )
    const recipients: Recipient[] = Array.isArray(body.recipients) ? body.recipients : []
    const message: string = (body.message ?? '').toString().trim()
    const subject: string = (body.subject ?? 'Message from your church').toString()
    const category: string = body.category ?? 'General Broadcast'

    if (authCheck.role !== 'super_admin' && churchId !== authCheck.churchId) {
      return NextResponse.json({ error: 'You are not authorized to send on behalf of this church.' }, { status: 403 })
    }
    if (requestedChannels.length === 0) {
      return NextResponse.json({ error: 'At least one channel (whatsapp, email, sms) is required.' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })
    }
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required.' }, { status: 400 })
    }

    const churchSnap = await adminDb.collection('churches').doc(churchId).get()
    if (!churchSnap.exists) {
      return NextResponse.json({ error: 'Church not found.' }, { status: 404 })
    }
    const church = churchSnap.data()!
    const rolePermissions = church.rolePermissions

    const infraSnap = await adminDb.collection('system').doc('infrastructure').get()
    const infra = infraSnap.exists ? infraSnap.data()! : {}

    const providerConfig: TenantProviderConfig = {}
    if (infra.metaWhatsappToken && infra.metaWhatsappPhoneId) {
      providerConfig.whatsapp = { providerId: 'meta_cloud', config: { phoneNumberId: infra.metaWhatsappPhoneId, accessToken: infra.metaWhatsappToken } }
    }
    if (infra.resendKey) {
      providerConfig.email = { providerId: 'resend', config: { apiKey: infra.resendKey, fromAddress: process.env.RESEND_FROM_EMAIL ?? 'noreply@mujteknify.com' } }
    }
    if (infra.termiiKey) {
      providerConfig.sms = { providerId: 'termii', config: { apiKey: infra.termiiKey, senderId: infra.termiiSenderId ?? 'ChurchOS' } }
    }

    const router = new CommunicationRouter(providerConfig)
    const channelResults: Array<{ channel: Channel; attempted: number; sent: number; failed: number; skipped?: string; error?: string }> = []

    // Each channel is fully isolated — a thrown error or a disabled/
    // unconfigured channel only affects its own entry, never the others.
    await Promise.all(
      requestedChannels.map(async (channel: Channel) => {
        const featureCheck = await requireChurchFeature(churchId, CHANNEL_FEATURE[channel], {
          role: authCheck.role,
          rolePermissions,
          roleModule: 'communications',
        })
        if (!featureCheck.authorized) {
          channelResults.push({ channel, attempted: 0, sent: 0, failed: 0, skipped: featureCheck.error })
          return
        }
        if (!providerConfig[channel]) {
          channelResults.push({ channel, attempted: 0, sent: 0, failed: 0, skipped: `${channel} provider is not configured on the platform yet.` })
          return
        }

        try {
          if (channel === 'whatsapp') {
            const numbers = recipients.map((r) => r.phone).filter((v): v is string => !!v)
            if (numbers.length === 0) {
              channelResults.push({ channel, attempted: 0, sent: 0, failed: 0, skipped: 'No recipients with a phone number.' })
              return
            }
            const result = await router.broadcastWhatsApp(numbers, message)
            channelResults.push({ channel, attempted: result.total, sent: result.sent, failed: result.failed })
          } else if (channel === 'sms') {
            const numbers = recipients.map((r) => r.phone).filter((v): v is string => !!v)
            if (numbers.length === 0) {
              channelResults.push({ channel, attempted: 0, sent: 0, failed: 0, skipped: 'No recipients with a phone number.' })
              return
            }
            const result = await router.broadcastSms(numbers, message)
            channelResults.push({ channel, attempted: result.total, sent: result.sent, failed: result.failed })
          } else if (channel === 'email') {
            const emailRecipients = recipients.filter((r) => !!r.email)
            if (emailRecipients.length === 0) {
              channelResults.push({ channel, attempted: 0, sent: 0, failed: 0, skipped: 'No recipients with an email address.' })
              return
            }
            let sent = 0
            let failed = 0
            for (const r of emailRecipients) {
              const result = await router.sendEmail(r.email!, subject, { text: message }).catch(() => ({ success: false }))
              if (result.success) sent++
              else failed++
            }
            channelResults.push({ channel, attempted: emailRecipients.length, sent, failed })
          }
        } catch (err: any) {
          console.error(`[BROADCAST] Channel ${channel} failed:`, err)
          channelResults.push({ channel, attempted: recipients.length, sent: 0, failed: recipients.length, error: err?.message ?? 'Unknown provider error' })
        }
      })
    )

    const totalSent = channelResults.reduce((sum, r) => sum + r.sent, 0)
    const totalFailed = channelResults.reduce((sum, r) => sum + r.failed, 0)
    const status = totalSent > 0 && totalFailed === 0 ? 'sent' : totalSent > 0 ? 'partial' : 'failed'

    await adminDb.collection('churches').doc(churchId).collection('communications').add({
      channels: requestedChannels,
      category,
      subject,
      message,
      recipientCount: recipients.length,
      channelResults,
      status,
      sentBy: authCheck.uid,
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true, status, channelResults })
  } catch (err: any) {
    console.error('[API_COMMUNICATIONS_BROADCAST] error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to send broadcast.' }, { status: 500 })
  }
}
