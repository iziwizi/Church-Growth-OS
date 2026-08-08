import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/admin/openrouter/test
 * Tests stored OpenRouter credentials server-side via real OpenRouter API request.
 * Reads from canonical system/infrastructure document (and system/ai_providers fallback).
 * Never exposes the API key to client.
 * Never deducts church AI credits.
 */
export async function POST() {
  try {
    let openrouterKey = process.env.OPENROUTER_API_KEY ?? ''
    let primaryModel = 'openai/gpt-4o-mini'

    if (adminDb) {
      try {
        // 1. Primary lookup: system/infrastructure
        const infraSnap = await adminDb.collection('system').doc('infrastructure').get()
        if (infraSnap.exists) {
          const cfg = infraSnap.data()
          if (cfg?.openrouterKey) openrouterKey = cfg.openrouterKey
          else if (cfg?.openrouterApiKey) openrouterKey = cfg.openrouterApiKey
          if (cfg?.aiDefaultModel) primaryModel = cfg.aiDefaultModel
          else if (cfg?.primaryModel) primaryModel = cfg.primaryModel
        }

        // 2. Legacy fallback lookup: system/ai_providers
        if (!openrouterKey) {
          const aiConfigSnap = await adminDb.collection('system').doc('ai_providers').get()
          if (aiConfigSnap.exists) {
            const cfg = aiConfigSnap.data()
            if (cfg?.openrouterApiKey) openrouterKey = cfg.openrouterApiKey
            else if (cfg?.openrouterKey) openrouterKey = cfg.openrouterKey
            if (cfg?.primaryModel) primaryModel = cfg.primaryModel
          }
        }
      } catch (err) {
        console.warn('[OPENROUTER_TEST] Could not load AI config from Firestore:', err)
      }
    }

    if (!openrouterKey || !openrouterKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'No OpenRouter API key configured in system settings. Save your API key first.' },
        { status: 400 }
      )
    }

    const cleanKey = openrouterKey.trim()

    // 3. Make minimal test request to OpenRouter Chat API
    const testRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mujteknify.com',
        'X-Title': 'Church Growth OS — Admin Connection Test',
      },
      body: JSON.stringify({
        model: primaryModel,
        messages: [
          {
            role: 'user',
            content: 'Respond with exactly: "CONNECTION_OK"',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    })

    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}))
      const errMsg = errData?.error?.message ?? `HTTP ${testRes.status}: ${testRes.statusText}`
      return NextResponse.json(
        { success: false, error: `OpenRouter validation failed: ${errMsg}` },
        { status: 400 }
      )
    }

    const data = await testRes.json()
    const reply = data.choices?.[0]?.message?.content?.trim() ?? 'OK'

    return NextResponse.json({
      success: true,
      message: `✅ OpenRouter connection verified successfully! Model: ${primaryModel}. Test Response: "${reply}"`,
      model: primaryModel,
    })
  } catch (err: any) {
    console.error('[OPENROUTER_TEST] Request exception:', err)
    return NextResponse.json(
      { success: false, error: err.message ?? 'OpenRouter connection test failed.' },
      { status: 500 }
    )
  }
}
