import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/admin/ai-providers - Returns AI provider settings with masked keys
 * POST /api/admin/ai-providers - Saves canonical AI provider configuration
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const docSnap = await adminDb.collection('system').doc('infrastructure').get()
    const data = docSnap.exists ? docSnap.data() : {}

    const openrouterKey = data?.openrouterKey || process.env.OPENROUTER_API_KEY || ''
    const maskedOpenRouter = openrouterKey ? (openrouterKey.length > 8 ? `${openrouterKey.substring(0, 7)}••••••••${openrouterKey.substring(openrouterKey.length - 4)}` : '••••••••') : ''

    const config = {
      provider: data?.aiProvider || 'openrouter',
      openrouterKey: maskedOpenRouter,
      defaultModel: data?.aiDefaultModel || 'anthropic/claude-3.5-sonnet',
      fallbackModel: data?.aiFallbackModel || 'openai/gpt-4o-mini',
      aiMode: data?.aiDefaultMode || 'autonomous',
      enabled: data?.aiEnabled ?? true,
      maxTokens: data?.aiMaxTokens || 4096,
      temperature: data?.aiTemperature || 0.7,
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
    const { openrouterKey, defaultModel, fallbackModel, aiMode, enabled } = body

    const existingDoc = await adminDb.collection('system').doc('infrastructure').get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const updatePayload: Record<string, any> = {
      aiProvider: 'openrouter',
      aiDefaultModel: defaultModel || existingData?.aiDefaultModel || 'anthropic/claude-3.5-sonnet',
      aiFallbackModel: fallbackModel || existingData?.aiFallbackModel || 'openai/gpt-4o-mini',
      aiDefaultMode: aiMode || 'autonomous',
      aiEnabled: enabled !== undefined ? enabled : true,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (openrouterKey && typeof openrouterKey === 'string' && !openrouterKey.includes('••••')) {
      updatePayload.openrouterKey = openrouterKey.trim()
    }

    await adminDb.collection('system').doc('infrastructure').set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Canonical OpenRouter AI settings saved successfully' })
  } catch (err: any) {
    console.error('[API_ADMIN_AI_PROVIDERS] POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save AI settings' }, { status: 500 })
  }
}
