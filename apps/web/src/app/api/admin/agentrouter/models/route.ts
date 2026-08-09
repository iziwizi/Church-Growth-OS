import { NextRequest, NextResponse } from 'next/server'
import { getCanonicalAIConfig } from '@/lib/server/ai-gateway'
import { verifySuperAdmin } from '@/lib/server/admin-guard'

export interface AgentRouterModelItem {
  id: string
  name: string
  provider?: string
  contextLength?: number
  description?: string
}

// Canonical curated models available through AgentRouter
const STANDARD_AGENTROUTER_MODELS: AgentRouterModelItem[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Anthropic)', provider: 'Anthropic', contextLength: 200000, description: 'Best for complex reasoning, sermon repurposing, and executive reports' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', provider: 'Anthropic', contextLength: 200000, description: 'Latest state-of-the-art hybrid reasoning model' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Fast)', provider: 'Anthropic', contextLength: 200000, description: 'High-speed, cost-efficient for visitor follow-ups and short broadcasts' },
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI Omni)', provider: 'OpenAI', contextLength: 128000, description: 'Flagship multimodal model with broad world knowledge' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Effective)', provider: 'OpenAI', contextLength: 128000, description: 'Fast, highly economical for high-volume WhatsApp and SMS generation' },
  { id: 'o1', name: 'OpenAI o1 (Deep Reasoning)', provider: 'OpenAI', contextLength: 128000, description: 'Advanced reasoning for strategic ministry planning' },
  { id: 'o3-mini', name: 'OpenAI o3-mini (Reasoning)', provider: 'OpenAI', contextLength: 128000, description: 'Fast reasoning model optimized for STEM and structured data' },
  { id: 'deepseek-r1', name: 'DeepSeek R1 (Open Reasoning)', provider: 'DeepSeek', contextLength: 64000, description: 'Exceptional open-weights reasoning performance' },
  { id: 'deepseek-v3', name: 'DeepSeek V3 (High Throughput)', provider: 'DeepSeek', contextLength: 64000, description: 'High-performance general purpose model' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google)', provider: 'Google', contextLength: 1000000, description: 'Ultra-low latency with massive 1M context window' },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Google)', provider: 'Google', contextLength: 2000000, description: 'Deep reasoning and complex document analysis' },
  { id: 'llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B', provider: 'Meta', contextLength: 128000, description: 'High capability open model' },
]

/**
 * GET /api/admin/agentrouter/models
 * Dynamically queries AgentRouter's /v1/models endpoint if key is configured,
 * or returns curated AgentRouter model catalog.
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  try {
    const config = await getCanonicalAIConfig()
    const { agentRouter } = config

    if (agentRouter.apiKey && agentRouter.apiKey.trim()) {
      const baseUrl = agentRouter.baseUrl || 'https://co.agentrouter.org/v1'
      const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`

      try {
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${agentRouter.apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
        })

        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            const dynamicModels: AgentRouterModelItem[] = data.data.map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
              provider: m.owned_by || m.provider || 'AgentRouter',
              contextLength: m.context_length || 128000,
              description: `AgentRouter model ${m.id}`,
            }))

            return NextResponse.json({
              success: true,
              models: dynamicModels,
              source: 'agentrouter_live_api',
              count: dynamicModels.length,
            })
          }
        }
      } catch (fetchErr) {
        console.warn('[AGENTROUTER_MODELS] Live discovery failed, using standard catalog:', fetchErr)
      }
    }

    return NextResponse.json({
      success: true,
      models: STANDARD_AGENTROUTER_MODELS,
      source: 'agentrouter_standard_catalog',
      count: STANDARD_AGENTROUTER_MODELS.length,
    })
  } catch (err: any) {
    console.error('[AGENTROUTER_MODELS] Error:', err)
    return NextResponse.json({
      success: true,
      models: STANDARD_AGENTROUTER_MODELS,
      source: 'fallback',
    })
  }
}
