import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Mask secret string showing first 6 and last 4 characters.
 */
function maskSecret(secret?: string): string {
  if (!secret) return ''
  if (secret.length <= 8) return '••••••••'
  return `${secret.substring(0, 6)}••••••••${secret.substring(secret.length - 4)}`
}

/**
 * GET /api/admin/ai-providers
 * Returns canonical AI Gateway (AgentRouter) & Direct Providers configuration.
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const agentrouterKey =
      data?.agentrouterKey ||
      data?.agentRouterKey ||
      data?.agentrouterApiKey ||
      data?.openrouterKey ||
      data?.openrouterApiKey ||
      process.env.AGENTROUTER_API_KEY ||
      ''

    const config = {
      // Primary AI Gateway: AgentRouter
      agentrouterKey: maskSecret(agentrouterKey),
      hasAgentRouterKey: !!agentrouterKey,
      agentrouterBaseUrl: data?.agentrouterBaseUrl || 'https://co.agentrouter.org/v1',
      agentrouterProtocol: data?.agentrouterProtocol || 'openai',
      primaryModel: data?.aiDefaultModel || data?.primaryModel || 'anthropic/claude-3.5-sonnet',
      fallbackModel: data?.aiFallbackModel || data?.fallbackModel || 'gpt-4o-mini',
      aiMode: data?.aiDefaultMode || 'autonomous',
      enabled: data?.aiEnabled ?? true,
      lastTested: data?.agentrouterLastTested ? data.agentrouterLastTested.toDate?.()?.toISOString() : null,
      status: data?.agentrouterStatus || (agentrouterKey ? 'configured' : 'unconfigured'),
      latencyMs: data?.agentrouterLatencyMs || null,

      // Task-level model routing matrix
      taskRouting: data?.taskRouting || {
        VISITOR_FOLLOW_UP: 'anthropic/claude-3.5-sonnet',
        SERMON_SUMMARY: 'anthropic/claude-3.5-sonnet',
        EMAIL_WRITING: 'anthropic/claude-3.5-sonnet',
        WHATSAPP_WRITING: 'gpt-4o-mini',
        CONTENT_SUMMARY: 'gpt-4o-mini',
        DAILY_REPORT: 'anthropic/claude-3.5-sonnet',
        STRATEGIC_ANALYSIS: 'anthropic/claude-3.5-sonnet',
        PRAYER_DEVOTIONAL: 'anthropic/claude-3.5-sonnet',
        EVENT_PROMO: 'gpt-4o-mini',
        STORE_PROMOTION: 'gpt-4o-mini',
      },

      // Direct Providers (Optional)
      directProviders: {
        openaiKey: maskSecret(data?.openaiKey || process.env.OPENAI_API_KEY),
        hasOpenaiKey: !!(data?.openaiKey || process.env.OPENAI_API_KEY),
        anthropicKey: maskSecret(data?.claudeKey || data?.anthropicKey || process.env.ANTHROPIC_API_KEY),
        hasAnthropicKey: !!(data?.claudeKey || data?.anthropicKey || process.env.ANTHROPIC_API_KEY),
        geminiKey: maskSecret(data?.geminiKey || process.env.GEMINI_API_KEY),
        hasGeminiKey: !!(data?.geminiKey || process.env.GEMINI_API_KEY),
        deepseekKey: maskSecret(data?.deepseekKey || process.env.DEEPSEEK_API_KEY),
        hasDeepseekKey: !!(data?.deepseekKey || process.env.DEEPSEEK_API_KEY),
      },
    }

    return NextResponse.json({ success: true, config })
  } catch (err: any) {
    console.error('[API_ADMIN_AI_PROVIDERS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load AI settings' }, { status: 500 })
  }
}

/**
 * POST /api/admin/ai-providers
 * Saves canonical AgentRouter & Direct Providers settings to system/infrastructure.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      agentrouterKey,
      agentrouterBaseUrl,
      agentrouterProtocol,
      primaryModel,
      fallbackModel,
      aiMode,
      enabled,
      taskRouting,
      directProviders,
    } = body

    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const selectedPrimaryModel = primaryModel || existingData?.aiDefaultModel || 'anthropic/claude-3.5-sonnet'
    const selectedFallbackModel = fallbackModel || existingData?.aiFallbackModel || 'gpt-4o-mini'

    const updatePayload: Record<string, any> = {
      aiProvider: 'agentrouter',
      agentrouterBaseUrl: agentrouterBaseUrl || 'https://co.agentrouter.org/v1',
      agentrouterProtocol: agentrouterProtocol || 'openai',
      aiDefaultModel: selectedPrimaryModel,
      primaryModel: selectedPrimaryModel,
      aiFallbackModel: selectedFallbackModel,
      fallbackModel: selectedFallbackModel,
      aiDefaultMode: aiMode || 'autonomous',
      aiEnabled: enabled !== undefined ? enabled : true,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (taskRouting) {
      updatePayload.taskRouting = taskRouting
    }

    // Save AgentRouter key if updated
    if (agentrouterKey && typeof agentrouterKey === 'string' && !agentrouterKey.includes('••••')) {
      const cleanKey = agentrouterKey.trim()
      updatePayload.agentrouterKey = cleanKey
      updatePayload.agentRouterKey = cleanKey
      updatePayload.agentrouterApiKey = cleanKey
      // Backward compatibility mirror
      updatePayload.openrouterKey = cleanKey
      updatePayload.openrouterApiKey = cleanKey
    }

    // Save Direct Providers if provided
    if (directProviders) {
      if (directProviders.openaiKey && !directProviders.openaiKey.includes('••••')) {
        updatePayload.openaiKey = directProviders.openaiKey.trim()
      }
      if (directProviders.anthropicKey && !directProviders.anthropicKey.includes('••••')) {
        updatePayload.claudeKey = directProviders.anthropicKey.trim()
        updatePayload.anthropicKey = directProviders.anthropicKey.trim()
      }
      if (directProviders.geminiKey && !directProviders.geminiKey.includes('••••')) {
        updatePayload.geminiKey = directProviders.geminiKey.trim()
      }
      if (directProviders.deepseekKey && !directProviders.deepseekKey.includes('••••')) {
        updatePayload.deepseekKey = directProviders.deepseekKey.trim()
      }
    }

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'AgentRouter & AI Gateway configuration saved successfully.' })
  } catch (err: any) {
    console.error('[API_ADMIN_AI_PROVIDERS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save AI configuration' }, { status: 500 })
  }
}
