import { NextRequest, NextResponse } from 'next/server'
import { executeAIGateway, type AITaskType } from '@/lib/server/ai-gateway'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { requireChurchFeature } from '@/lib/server/feature-access'
import { adminDb } from '@/lib/firebase/admin-sdk'

const CONTENT_TYPE_MAP: Record<string, AITaskType> = {
  sermon_reels: 'CONTENT_SUMMARY',
  announcement: 'WHATSAPP_WRITING',
  newsletter: 'EMAIL_WRITING',
  prayer_content: 'PRAYER_DEVOTIONAL',
  event_promo: 'EVENT_PROMO',
  follow_up: 'VISITOR_FOLLOW_UP',
  sermon_summary: 'SERMON_SUMMARY',
  whatsapp_broadcast: 'WHATSAPP_WRITING',
  store_promotion: 'STORE_PROMOTION',
}

/**
 * POST /api/ai/generate
 * Centralized AI content generation endpoint.
 * Routes through the canonical AgentRouter AI Gateway.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`ai-generate:${authCheck.uid}`, 20, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI generation requests. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { prompt, contentType, churchName, model } = body
    const requestedChurchId = body.churchId as string | undefined

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    // A church's AI credits may only be spent by a verified member of that
    // church (or the platform Super Admin) — never by a client-supplied id.
    if (authCheck.role !== 'super_admin' && requestedChurchId !== authCheck.churchId) {
      return NextResponse.json({ error: 'You are not authorized to generate content for this church.' }, { status: 403 })
    }

    const churchId = requestedChurchId ?? authCheck.churchId ?? undefined

    // Global Feature Flag AND Plan Entitlement AND Role Permission — the
    // one composed access check (see lib/server/feature-access.ts). This
    // route previously had no feature/plan gate at all
    // (docs/PRODUCTION_ENGINEERING_AUDIT.md §2/§5, finding S7).
    if (churchId && authCheck.role !== 'super_admin') {
      const churchSnap = adminDb ? await adminDb.collection('churches').doc(churchId).get() : null
      const rolePermissions = churchSnap?.exists ? churchSnap.data()?.rolePermissions : undefined
      const featureCheck = await requireChurchFeature(churchId, 'ai_studio', {
        role: authCheck.role,
        rolePermissions,
        roleModule: 'ai',
      })
      if (!featureCheck.authorized) {
        return NextResponse.json({ error: featureCheck.error ?? 'AI Studio is not available on your plan.' }, { status: 403 })
      }
    }

    const task = (CONTENT_TYPE_MAP[contentType] || 'CONTENT_SUMMARY') as AITaskType

    const response = await executeAIGateway({
      prompt: prompt.trim(),
      task,
      contentType,
      churchId,
      churchName,
      userId: authCheck.uid,
      preferredModel: model,
    })

    if (!response.success) {
      return NextResponse.json({ error: response.error ?? 'Generation failed.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result: response.result,
      provider: response.provider,
      model: response.model,
      creditsConsumed: response.creditsConsumed,
      latencyMs: response.latencyMs,
      usedTemplateFallback: response.usedTemplateFallback ?? false,
      providerError: response.providerError,
    })
  } catch (err: any) {
    console.error('[API_AI_GENERATE] Execution error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'An unexpected error occurred during AI generation.' },
      { status: 500 }
    )
  }
}
