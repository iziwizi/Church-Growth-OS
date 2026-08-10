import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'

export type AITaskType =
  | 'VISITOR_FOLLOW_UP'
  | 'SERMON_SUMMARY'
  | 'EMAIL_WRITING'
  | 'WHATSAPP_WRITING'
  | 'CONTENT_SUMMARY'
  | 'DAILY_REPORT'
  | 'STRATEGIC_ANALYSIS'
  | 'PRAYER_DEVOTIONAL'
  | 'EVENT_PROMO'
  | 'STORE_PROMOTION'

export interface AIGatewayRequest {
  prompt: string
  task?: AITaskType
  contentType?: string
  churchId?: string
  churchName?: string
  userId?: string
  preferredModel?: string
  maxTokens?: number
  temperature?: number
}

export interface AIGatewayResponse {
  success: boolean
  result: string
  provider: string
  model: string
  task: string
  creditsConsumed: number
  latencyMs: number
  error?: string
  /** True when every real provider failed and an offline canned template was returned instead — not a real AI generation. */
  usedTemplateFallback?: boolean
  /** The upstream provider error that caused the template fallback, if any. */
  providerError?: string
}

export interface AgentRouterConfig {
  apiKey: string
  baseUrl: string
  protocol: 'openai' | 'anthropic'
  primaryModel: string
  fallbackModel: string
  taskRouting: Record<string, string>
  enabled: boolean
}

/**
 * Loads the canonical AI configuration from server-side Firestore.
 */
export async function getCanonicalAIConfig(): Promise<{
  agentRouter: AgentRouterConfig
  directProviders: {
    openaiKey?: string
    anthropicKey?: string
    geminiKey?: string
    deepseekKey?: string
    openrouterKey?: string
  }
}> {
  let agentRouterKey = process.env.AGENTROUTER_API_KEY ?? ''
  let baseUrl = 'https://co.agentrouter.org/v1'
  let protocol: 'openai' | 'anthropic' = 'openai'
  let primaryModel = 'anthropic/claude-3.5-sonnet'
  let fallbackModel = 'gpt-4o-mini'
  let enabled = true
  let taskRouting: Record<string, string> = {
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
  }

  const directProviders = {
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    deepseekKey: process.env.DEEPSEEK_API_KEY,
    openrouterKey: process.env.OPENROUTER_API_KEY,
  }

  if (adminDb) {
    try {
      const snap = await adminDb.collection('system').doc('infrastructure').get()
      if (snap.exists) {
        const data = snap.data()!
        if (data.agentrouterKey || data.agentRouterKey || data.agentrouterApiKey) {
          agentRouterKey = data.agentrouterKey || data.agentRouterKey || data.agentrouterApiKey
        } else if (data.openrouterKey || data.openrouterApiKey) {
          // Backward compatibility fallback if user stored key under previous name
          agentRouterKey = data.openrouterKey || data.openrouterApiKey
        }

        if (data.agentrouterBaseUrl) baseUrl = data.agentrouterBaseUrl
        if (data.agentrouterProtocol) protocol = data.agentrouterProtocol
        if (data.aiDefaultModel || data.primaryModel) primaryModel = data.aiDefaultModel || data.primaryModel
        if (data.aiFallbackModel || data.fallbackModel) fallbackModel = data.aiFallbackModel || data.fallbackModel
        if (data.aiEnabled !== undefined) enabled = data.aiEnabled
        if (data.taskRouting) taskRouting = { ...taskRouting, ...data.taskRouting }

        if (data.openaiKey) directProviders.openaiKey = data.openaiKey
        if (data.claudeKey || data.anthropicKey) directProviders.anthropicKey = data.claudeKey || data.anthropicKey
        if (data.geminiKey) directProviders.geminiKey = data.geminiKey
        if (data.deepseekKey) directProviders.deepseekKey = data.deepseekKey
        if (data.openrouterKey) directProviders.openrouterKey = data.openrouterKey
      }
    } catch (err) {
      console.warn('[AI_GATEWAY] Could not read system/infrastructure config:', err)
    }
  }

  return {
    agentRouter: {
      apiKey: agentRouterKey,
      baseUrl: baseUrl.replace(/\/+$/, ''), // strip trailing slash
      protocol,
      primaryModel,
      fallbackModel,
      taskRouting,
      enabled,
    },
    directProviders,
  }
}

/**
 * Task instructions for specialized ministry AI generation.
 */
const TASK_SYSTEM_PROMPTS: Record<string, string> = {
  VISITOR_FOLLOW_UP: 'You are a warm, pastoral first-time visitor follow-up AI. Craft a heartfelt, welcoming, non-intrusive message that inspires the visitor to return, offering prayer and connection.',
  SERMON_SUMMARY: 'You are an executive theologian AI. Extract the core spiritual thesis, 3 actionable transformational steps, supporting scripture verses, and discussion prompts from sermon notes/transcripts.',
  EMAIL_WRITING: 'You are an inspiring ministry communications director. Write compelling, well-structured, faith-filled email newsletters with a clear pastoral voice and call to action.',
  WHATSAPP_WRITING: 'You are a church engagement specialist. Draft clear, friendly, mobile-optimized WhatsApp broadcasts with tasteful emoji formatting and essential event/service details.',
  CONTENT_SUMMARY: 'You are a church media assistant. Condense ministry materials into punchy, spiritually uplifting summaries for bulletins, social captions, and announcement decks.',
  DAILY_REPORT: 'You are an executive church growth analytics AI. Deliver an encouraging, actionable, data-driven daily summary for the senior pastor highlighting growth milestones and attention areas.',
  STRATEGIC_ANALYSIS: 'You are a church development strategist. Provide insightful analysis on congregation engagement, retention bottlenecks, and growth opportunities.',
  PRAYER_DEVOTIONAL: 'You are a devotional author. Write inspiring 3-point scripture reflections with a faith declaration and practical prayer points.',
  EVENT_PROMO: 'You are a ministry event promoter. Create exciting, high-energy promotional copy designed to maximize attendance and spiritual expectation.',
  STORE_PROMOTION: 'You are a church resources director. Create compelling, respectful promotional copy for ministry books, courses, and materials that emphasizes their spiritual value.',
}

/**
 * Canonical AI Gateway Execution Function.
 * Handles task routing, authentication, credit deduction, provider fallback, and telemetry.
 */
export async function executeAIGateway(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  const startTime = Date.now()
  const task: AITaskType = req.task ?? 'CONTENT_SUMMARY'
  const churchId = req.churchId

  // 1. Credit Check: Ensure church has remaining AI credits
  if (churchId && adminDb) {
    try {
      const churchSnap = await adminDb.collection('churches').doc(churchId).get()
      if (churchSnap.exists) {
        const churchData = churchSnap.data()!
        const creditsRemaining = churchData.subscription?.aiCreditsRemaining ?? 2500
        if (creditsRemaining <= 0) {
          return {
            success: false,
            result: '',
            provider: 'AgentRouter',
            model: 'none',
            task,
            creditsConsumed: 0,
            latencyMs: Date.now() - startTime,
            error: 'AI content generation quota reached. Please upgrade your subscription plan to receive additional AI credits.',
          }
        }
      }
    } catch (creditErr) {
      console.warn('[AI_GATEWAY] Credit pre-check warning:', creditErr)
    }
  }

  // 2. Load Configuration
  const config = await getCanonicalAIConfig()
  const { agentRouter, directProviders } = config

  // Determine target model
  let selectedModel =
    req.preferredModel ||
    agentRouter.taskRouting[task] ||
    agentRouter.primaryModel ||
    'anthropic/claude-3.5-sonnet'

  const systemInstruction =
    TASK_SYSTEM_PROMPTS[task] ??
    `You are an expert ministry communications AI for ${req.churchName ?? 'a Christian church'}. Provide pastoral, uplifting, and production-ready outputs.`

  let generatedText = ''
  let activeProvider = 'AgentRouter'
  let activeModel = selectedModel
  let lastError: string | null = null

  // 3. Primary Execution: AgentRouter Gateway
  if (agentRouter.apiKey && agentRouter.apiKey.trim()) {
    try {
      const isAnthropicProtocol = agentRouter.protocol === 'anthropic'
      const cleanBaseUrl = agentRouter.baseUrl

      const timeoutController = new AbortController()
      const timeoutHandle = setTimeout(() => timeoutController.abort(), 20_000)

      if (isAnthropicProtocol) {
        // Anthropic Compatible endpoint: POST ${baseUrl}/v1/messages — guard
        // against a double `/v1` if the base URL already includes it (see
        // the same fix in api/admin/agentrouter/test/route.ts).
        const endpoint = cleanBaseUrl.endsWith('/v1') ? `${cleanBaseUrl}/messages` : `${cleanBaseUrl}/v1/messages`
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: timeoutController.signal,
          headers: {
            'x-api-key': agentRouter.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            system: systemInstruction,
            messages: [{ role: 'user', content: req.prompt }],
            max_tokens: req.maxTokens ?? 1500,
            temperature: req.temperature ?? 0.7,
          }),
        }).finally(() => clearTimeout(timeoutHandle))

        if (res.ok) {
          const data = await res.json()
          generatedText = data.content?.[0]?.text ?? ''
          activeProvider = 'AgentRouter (Anthropic)'
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData?.error?.message ?? `AgentRouter Anthropic error HTTP ${res.status}`
        }
      } else {
        // OpenAI Compatible endpoint: POST ${baseUrl}/chat/completions
        const endpoint = cleanBaseUrl.endsWith('/v1')
          ? `${cleanBaseUrl}/chat/completions`
          : `${cleanBaseUrl}/v1/chat/completions`

        const res = await fetch(endpoint, {
          method: 'POST',
          signal: timeoutController.signal,
          headers: {
            Authorization: `Bearer ${agentRouter.apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: req.prompt },
            ],
            max_tokens: req.maxTokens ?? 1500,
            temperature: req.temperature ?? 0.7,
          }),
        }).finally(() => clearTimeout(timeoutHandle))

        if (res.ok) {
          const data = await res.json()
          generatedText = data.choices?.[0]?.message?.content ?? ''
          activeProvider = 'AgentRouter (OpenAI-compatible)'
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData?.error?.message ?? `AgentRouter HTTP ${res.status}`
        }
      }
    } catch (agentRouterErr: any) {
      lastError = agentRouterErr?.message ?? 'AgentRouter network error'
      console.warn('[AI_GATEWAY] AgentRouter primary call failed:', agentRouterErr)
    }
  }

  // 4. Fallback Execution: Direct Providers if AgentRouter was not configured or failed
  if (!generatedText && directProviders.geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${directProviders.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemInstruction}\n\n${req.prompt}` }] },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: req.maxTokens ?? 1500,
            },
          }),
        }
      )
      if (geminiRes.ok) {
        const data = await geminiRes.json()
        generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (generatedText) {
          activeProvider = 'Google Gemini (Fallback)'
          activeModel = 'gemini-1.5-flash'
        }
      }
    } catch (geminiErr) {
      console.warn('[AI_GATEWAY] Gemini fallback failed:', geminiErr)
    }
  }

  // 5. Fallback Execution: Structured Ministry Templates. This is NOT real
  // AI generation — it's a canned, offline-safe placeholder so the UI has
  // something to show when every real provider failed. Credits must not be
  // deducted for it (see step 6) and the caller must be told this happened
  // rather than presenting it as a normal successful generation — a
  // previous version deducted a credit and reported success unconditionally
  // whenever this path was hit (docs/PRODUCTION_ENGINEERING_AUDIT.md §5).
  let usedTemplateFallback = false
  if (!generatedText) {
    generatedText = generateStructuredMinistryTemplate(task, req.prompt, req.churchName ?? 'Church')
    activeProvider = 'Ministry Template Engine (Offline Safe)'
    activeModel = 'template-v1'
    usedTemplateFallback = true
    if (lastError) {
      console.warn('[AI_GATEWAY] Falling back to offline template after provider failure:', lastError)
    }
  }

  const latencyMs = Date.now() - startTime

  // 6. Atomic Usage Tracking & Single Credit Deduction (Only for real
  // provider generations — never for the offline template fallback).
  let creditsConsumed = 0
  if (generatedText && !usedTemplateFallback && churchId && adminDb) {
    try {
      creditsConsumed = 1
      const churchRef = adminDb.collection('churches').doc(churchId)
      await churchRef.update({
        'subscription.aiCreditsRemaining': FieldValue.increment(-1),
        'metrics.totalAiGenerations': FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      })

      // Log detailed AI usage record
      await churchRef.collection('aiUsage').add({
        task,
        contentType: req.contentType ?? task,
        promptSnippet: req.prompt.slice(0, 120),
        provider: activeProvider,
        model: activeModel,
        creditsDeducted: 1,
        latencyMs,
        userId: req.userId ?? 'system',
        createdAt: FieldValue.serverTimestamp(),
      })
    } catch (deductErr) {
      console.warn('[AI_GATEWAY] Could not update church credits:', deductErr)
    }
  }

  return {
    success: true,
    result: generatedText,
    provider: activeProvider,
    model: activeModel,
    task,
    creditsConsumed,
    latencyMs,
    usedTemplateFallback,
    providerError: usedTemplateFallback ? lastError ?? undefined : undefined,
  }
}

/**
 * Fallback Template Engine for resilient offline generation.
 */
function generateStructuredMinistryTemplate(task: AITaskType, prompt: string, churchName: string): string {
  switch (task) {
    case 'VISITOR_FOLLOW_UP':
      return `Dear Beloved Friend,\n\nIt was truly a joy having you worship with us at ${churchName}!\n\n${prompt}\n\nWe believe God has wonderful things in store for you and your family. If there is any way we can stand in prayer with you this week, please reply directly to this message.\n\nWarm pastoral blessings,\nThe Ministry Team at ${churchName}`

    case 'SERMON_SUMMARY':
      return `📖 SERMON SUMMARY & SPIRITUAL ACTION STEPS — ${churchName}\n\nTheme: "${prompt}"\n\n1. CORE TRUTH\nGod is faithful to complete every good work He has begun in your life.\n\n2. SCRIPTURAL FOUNDATION\n"Being confident of this very thing, that He who has begun a good work in you will complete it until the day of Jesus Christ." (Philippians 1:6)\n\n3. ACTION STEPS\n• Spend 10 minutes in scripture and focused prayer daily.\n• Actively walk in love and extend grace in your workplace and home.\n• Share a testimony of God's goodness with someone this week.`

    case 'WHATSAPP_WRITING':
      return `✨ *${churchName.toUpperCase()} ANNOUNCEMENT* ✨\n\nBeloved family,\n\n${prompt}\n\n📌 *Join us live & in-person!* Come expectant for an impactful time in God's presence.\n\n📲 *Share this with family & friends!* 🙏`

    case 'EMAIL_WRITING':
      return `Dear Church Family,\n\nGreetings in the precious name of Jesus Christ!\n\n${prompt}\n\nAs we journey together this season, let us hold fast to the confession of our faith without wavering. We look forward to seeing you in service!\n\nIn His service,\nThe Pastoral Team at ${churchName}`

    case 'STORE_PROMOTION':
      return `📚 *MINISTRY RESOURCES FROM ${churchName.toUpperCase()}*\n\nBeloved,\n\nWe are delighted to share our latest spiritual resource with you:\n\n"${prompt}"\n\nThis material will enrich your spiritual walk and empower your faith. Visit our Church Store to order your copy today!`

    default:
      return `[Ministry Output for ${churchName}]\n\nTheme: "${prompt}"\n\nMay the grace and peace of our Lord Jesus Christ guide and empower you in all things.`
  }
}
