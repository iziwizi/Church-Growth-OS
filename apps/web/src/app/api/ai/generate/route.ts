import { NextResponse } from 'next/server'
import { executeAIGateway, type AITaskType } from '@/lib/server/ai-gateway'

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
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, contentType, churchName, churchId, model, userId } = body

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    const task = (CONTENT_TYPE_MAP[contentType] || 'CONTENT_SUMMARY') as AITaskType

    const response = await executeAIGateway({
      prompt: prompt.trim(),
      task,
      contentType,
      churchId,
      churchName,
      userId,
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
    })
  } catch (err: any) {
    console.error('[API_AI_GENERATE] Execution error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'An unexpected error occurred during AI generation.' },
      { status: 500 }
    )
  }
}
