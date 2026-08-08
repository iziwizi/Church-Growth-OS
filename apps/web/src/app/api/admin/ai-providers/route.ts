import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/ai-providers - Returns canonical AI provider settings with masked keys
 * POST /api/admin/ai-providers - Saves canonical AI provider configuration to system/infrastructure
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const openrouterKey = data?.openrouterKey || data?.openrouterApiKey || process.env.OPENROUTER_API_KEY || ''
    const maskedOpenRouter = openrouterKey
      ? openrouterKey.length > 8
        ? `${openrouterKey.substring(0, 7)}••••••••${openrouterKey.substring(openrouterKey.length - 4)}`
        : '••••••••'
      : ''

    const config = {
      provider: data?.aiProvider || 'openrouter',
      openrouterKey: maskedOpenRouter,
      hasKey: !!openrouterKey,
      defaultModel: data?.aiDefaultModel || data?.primaryModel || 'anthropic/claude-3.5-sonnet',
      fallbackModel: data?.aiFallbackModel || data?.fallbackModel || 'openai/gpt-4o-mini',
      aiMode: data?.aiDefaultMode || 'autonomous',
      enabled: data?.aiEnabled ?? true,
      maxTokens: data?.aiMaxTokens || 4096,
      temperature: data?.aiTemperature || 0.7,
      taskRouting: data?.taskRouting || {
        CONTENT_SUMMARY: 'openai/gpt-4o-mini',
        VISITOR_FOLLOW_UP: 'anthropic/claude-3.5-sonnet',
        EMAIL_WRITING: 'anthropic/claude-3.5-sonnet',
        WHATSAPP_WRITING: 'openai/gpt-4o-mini',
        SERMON_SUMMARY: 'anthropic/claude-3.5-sonnet',
      },
    }

    return NextResponse.json({ success: true, config })
  } catch (err: any) {
    console.error('[API_ADMIN_AI_PROVIDERS] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to load AI settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { openrouterKey, defaultModel, fallbackModel, aiMode, enabled, taskRouting } = body

    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const selectedDefaultModel = defaultModel || existingData?.aiDefaultModel || 'anthropic/claude-3.5-sonnet'
    const selectedFallbackModel = fallbackModel || existingData?.aiFallbackModel || 'openai/gpt-4o-mini'

    const updatePayload: Record<string, any> = {
      aiProvider: 'openrouter',
      aiDefaultModel: selectedDefaultModel,
      primaryModel: selectedDefaultModel, // Alias for backward compatibility
      aiFallbackModel: selectedFallbackModel,
      fallbackModel: selectedFallbackModel, // Alias for backward compatibility
      aiDefaultMode: aiMode || 'autonomous',
      aiEnabled: enabled !== undefined ? enabled : true,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (taskRouting) {
      updatePayload.taskRouting = taskRouting
    }

    if (openrouterKey && typeof openrouterKey === 'string' && !openrouterKey.includes('••••')) {
      const cleanKey = openrouterKey.trim()
      updatePayload.openrouterKey = cleanKey
      updatePayload.openrouterApiKey = cleanKey // Alias for backward compatibility
    }

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Canonical OpenRouter AI settings saved successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_AI_PROVIDERS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save AI settings' }, { status: 500 })
  }
}
