import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Read OpenRouter API key from environment (server-side only, never NEXT_PUBLIC_)
    const openrouterKey = process.env.OPENROUTER_API_KEY ?? ''

    // Default top OpenRouter models if key is missing or request fails
    const DEFAULT_MODELS = [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000, promptPricing: '0.000003', completionPricing: '0.000015' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (Omni)', contextLength: 128000, promptPricing: '0.0000025', completionPricing: '0.00001' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Cost-Effective)', contextLength: 128000, promptPricing: '0.00000015', completionPricing: '0.0000006' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Reasoning)', contextLength: 64000, promptPricing: '0.00000055', completionPricing: '0.00000219' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', contextLength: 1000000, promptPricing: '0.0000001', completionPricing: '0.0000004' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', contextLength: 128000, promptPricing: '0.00000012', completionPricing: '0.0000003' },
    ]

    if (!openrouterKey) {
      return NextResponse.json({
        source: 'default',
        models: DEFAULT_MODELS,
        notice: 'Configure OPENROUTER_API_KEY in Infrastructure to fetch live model discovery from OpenRouter API.',
      })
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://mujteknify.com',
        'X-Title': 'Church Growth OS',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ source: 'fallback', models: DEFAULT_MODELS })
    }

    const data = await res.json()
    const fetchedModels = (data.data ?? []).slice(0, 50).map((m: any) => ({
      id: m.id,
      name: m.name ?? m.id,
      contextLength: m.context_length ?? 128000,
      promptPricing: m.pricing?.prompt ?? '0.00',
      completionPricing: m.pricing?.completion ?? '0.00',
    }))

    return NextResponse.json({ source: 'live', models: fetchedModels.length > 0 ? fetchedModels : DEFAULT_MODELS })
  } catch (err: any) {
    console.error('OpenRouter model discovery error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to discover models.' }, { status: 500 })
  }
}
