import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/admin/openrouter/test
 * Tests the stored OpenRouter API key by making a minimal real request.
 * Never exposes the API key to the client.
 * Never deducts church AI credits.
 */
export async function POST() {
  try {
    // 1. Load the OpenRouter key from server-side Firestore (never from client)
    let openrouterKey = process.env.OPENROUTER_API_KEY ?? ''
    let primaryModel = 'openai/gpt-4o-mini'

    if (adminDb) {
      try {
        const aiConfigSnap = await adminDb.collection('system').doc('ai_providers').get()
        if (aiConfigSnap.exists) {
          const cfg = aiConfigSnap.data()
          if (cfg?.openrouterApiKey) openrouterKey = cfg.openrouterApiKey
          if (cfg?.primaryModel) primaryModel = cfg.primaryModel
        }
      } catch (err) {
        console.warn('Could not load AI config from Firestore:', err)
      }
    }

    if (!openrouterKey) {
      return NextResponse.json(
        { success: false, error: 'No OpenRouter API key configured. Save your API key first.' },
        { status: 400 }
      )
    }

    // 2. Make a minimal test request to OpenRouter
    const testRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mujteknify.com',
        'X-Title': 'Church Growth OS — Admin Test',
      },
      body: JSON.stringify({
        model: primaryModel,
        messages: [
          {
            role: 'user',
            content: 'Reply with only the word "OK" to confirm this test connection.',
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    })

    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}))
      const errMsg = errData?.error?.message ?? `OpenRouter returned status ${testRes.status}`
      return NextResponse.json(
        { success: false, error: `Connection failed: ${errMsg}` },
        { status: 400 }
      )
    }

    const data = await testRes.json()
    const reply = data.choices?.[0]?.message?.content?.trim() ?? ''

    return NextResponse.json({
      success: true,
      message: `✅ OpenRouter connected successfully. Model: ${primaryModel}. Response: "${reply}"`,
      model: primaryModel,
    })
  } catch (err: any) {
    console.error('OpenRouter test error:', err)
    return NextResponse.json(
      { success: false, error: err.message ?? 'Test request failed.' },
      { status: 500 }
    )
  }
}
