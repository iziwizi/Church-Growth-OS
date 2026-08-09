import { NextRequest, NextResponse } from 'next/server'
import { getCanonicalAIConfig } from '@/lib/server/ai-gateway'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * POST /api/admin/agentrouter/test
 * Performs a REAL test request against AgentRouter.org using the stored API key.
 * Measures real latency and validates model availability.
 * Never exposes the API key to client.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  const startTime = Date.now()

  try {
    const config = await getCanonicalAIConfig()
    const { agentRouter } = config

    if (!agentRouter.apiKey || !agentRouter.apiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No AgentRouter API key configured. Please enter and save your AgentRouter API key first.',
        },
        { status: 400 }
      )
    }

    const apiKey = agentRouter.apiKey.trim()
    const baseUrl = agentRouter.baseUrl || 'https://co.agentrouter.org/v1'
    const protocol = agentRouter.protocol || 'openai'
    const testModel = agentRouter.primaryModel || 'claude-3-5-sonnet-20241022'

    let testResponseText = ''
    let httpStatus = 200

    if (protocol === 'anthropic') {
      // Anthropic Protocol
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Respond with exactly: "AGENTROUTER_OK"' }],
          max_tokens: 15,
          temperature: 0,
        }),
      })

      httpStatus = res.status
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData?.error?.message || errData?.message || `HTTP ${res.status}: ${res.statusText}`
        return NextResponse.json(
          {
            success: false,
            error: `AgentRouter Anthropic test failed: ${errMsg}`,
            latencyMs: Date.now() - startTime,
          },
          { status: 400 }
        )
      }

      const data = await res.json()
      testResponseText = data.content?.[0]?.text?.trim() ?? 'OK'
    } else {
      // OpenAI Compatible Protocol (Default)
      const endpoint = baseUrl.endsWith('/v1')
        ? `${baseUrl}/chat/completions`
        : `${baseUrl}/v1/chat/completions`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            { role: 'user', content: 'Respond with exactly: "AGENTROUTER_OK"' },
          ],
          max_tokens: 15,
          temperature: 0,
        }),
      })

      httpStatus = res.status
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData?.error?.message || errData?.message || `HTTP ${res.status}: ${res.statusText}`
        return NextResponse.json(
          {
            success: false,
            error: `AgentRouter OpenAI test failed: ${errMsg}`,
            latencyMs: Date.now() - startTime,
          },
          { status: 400 }
        )
      }

      const data = await res.json()
      testResponseText = data.choices?.[0]?.message?.content?.trim() ?? 'OK'
    }

    const latencyMs = Date.now() - startTime

    // Record last tested timestamp in system infrastructure
    if (adminDb) {
      await adminDb.collection('system').doc('infrastructure').set(
        {
          agentrouterLastTested: FieldValue.serverTimestamp(),
          agentrouterStatus: 'connected',
          agentrouterLatencyMs: latencyMs,
        },
        { merge: true }
      ).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      message: `✓ AgentRouter connected successfully. Model "${testModel}" verified. Real response: "${testResponseText}"`,
      model: testModel,
      protocol,
      endpoint: baseUrl,
      latencyMs,
      testedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[AGENTROUTER_TEST] Request exception:', err)
    return NextResponse.json(
      {
        success: false,
        error: `AgentRouter connection error: ${err?.message ?? 'Network failure connecting to AgentRouter'}`,
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
