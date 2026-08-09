import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/server/admin-guard'
import { getCanonicalAIConfig } from '@/lib/server/ai-gateway'

/**
 * POST /api/admin/providers/test
 * Body: { provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' }
 * Executes a real minimal test request against the specified direct provider.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  const startTime = Date.now()

  try {
    const { provider } = await req.json()
    const { directProviders } = await getCanonicalAIConfig()

    switch (provider) {
      case 'openai': {
        const key = directProviders.openaiKey
        if (!key) {
          return NextResponse.json({ success: false, error: 'OpenAI API key is not configured.' }, { status: 400 })
        }
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Respond with "OK"' }],
            max_tokens: 5,
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: errData?.error?.message || `HTTP ${res.status}` }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: '✓ OpenAI connected successfully. Model: gpt-4o-mini',
          latencyMs: Date.now() - startTime,
        })
      }

      case 'anthropic': {
        const key = directProviders.anthropicKey
        if (!key) {
          return NextResponse.json({ success: false, error: 'Anthropic API key is not configured.' }, { status: 400 })
        }
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            messages: [{ role: 'user', content: 'Respond with "OK"' }],
            max_tokens: 5,
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: errData?.error?.message || `HTTP ${res.status}` }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: '✓ Anthropic connected successfully. Model: claude-3-5-haiku',
          latencyMs: Date.now() - startTime,
        })
      }

      case 'gemini': {
        const key = directProviders.geminiKey
        if (!key) {
          return NextResponse.json({ success: false, error: 'Google Gemini API key is not configured.' }, { status: 400 })
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with OK' }] }],
            }),
          }
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: errData?.error?.message || `HTTP ${res.status}` }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: '✓ Google Gemini connected successfully. Model: gemini-1.5-flash',
          latencyMs: Date.now() - startTime,
        })
      }

      case 'deepseek': {
        const key = directProviders.deepseekKey
        if (!key) {
          return NextResponse.json({ success: false, error: 'DeepSeek API key is not configured.' }, { status: 400 })
        }
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Respond with OK' }],
            max_tokens: 5,
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          return NextResponse.json({ success: false, error: errData?.error?.message || `HTTP ${res.status}` }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: '✓ DeepSeek connected successfully. Model: deepseek-chat',
          latencyMs: Date.now() - startTime,
        })
      }

      default:
        return NextResponse.json({ success: false, error: `Unsupported provider: ${provider}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Provider test failed' }, { status: 500 })
  }
}
