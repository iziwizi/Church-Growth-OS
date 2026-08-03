import { AIError } from '@church-growth-os/shared'
import type { AIProviderType } from '@church-growth-os/shared'
import type { IAIProvider, AIPrompt, AIResponse } from './interfaces'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'

// ============================================================
// PROVIDER REGISTRY
// ============================================================

type ProviderFactory = (config: Record<string, string>) => IAIProvider

const providerRegistry = new Map<AIProviderType, ProviderFactory>([
  ['claude', (cfg) => new ClaudeProvider({ apiKey: cfg['apiKey'] ?? '' })],
  ['openai', (cfg) => new OpenAIProvider({ apiKey: cfg['apiKey'] ?? '' })],
])

export function registerAIProvider(id: AIProviderType, factory: ProviderFactory): void {
  providerRegistry.set(id, factory)
}

// ============================================================
// AI ROUTER CONFIGURATION
// ============================================================

export interface AIRouterConfig {
  defaultProvider: AIProviderType
  fallbackProvider?: AIProviderType
  providerConfigs: Partial<Record<AIProviderType, Record<string, string>>>
  approvalRequired: boolean
  tokenBudgetPerMonth?: number
}

// ============================================================
// AI ROUTER
// ============================================================

/**
 * AIRouter is the single entry-point for all AI generation.
 * It reads the tenant's preferred provider, builds prompts with
 * church context guardrails, and handles fallback on failure.
 */
export class AIRouter {
  constructor(private readonly config: AIRouterConfig) {}

  private getProvider(preferredProvider?: AIProviderType): IAIProvider {
    const providerId = preferredProvider ?? this.config.defaultProvider
    const factory = providerRegistry.get(providerId)
    const providerConfig = this.config.providerConfigs[providerId]

    if (!factory) {
      throw new AIError(`Provider '${providerId}' is not registered`, providerId)
    }

    return factory(providerConfig ?? {})
  }

  /**
   * Generate AI content with automatic fallback.
   */
  async generate(
    prompt: AIPrompt,
    preferredProvider?: AIProviderType
  ): Promise<AIResponse> {
    try {
      const provider = this.getProvider(preferredProvider)
      return await provider.generate(prompt)
    } catch (primaryError) {
      // Attempt fallback provider
      if (this.config.fallbackProvider && this.config.fallbackProvider !== preferredProvider) {
        try {
          const fallbackProvider = this.getProvider(this.config.fallbackProvider)
          return await fallbackProvider.generate(prompt)
        } catch {
          throw new AIError(
            `Both primary and fallback providers failed. Primary: ${primaryError instanceof Error ? primaryError.message : 'Unknown'}`,
          )
        }
      }
      throw primaryError
    }
  }

  /**
   * Stream AI content.
   */
  async *stream(prompt: AIPrompt, preferredProvider?: AIProviderType) {
    const provider = this.getProvider(preferredProvider)
    yield* provider.stream(prompt)
  }

  get requiresApproval(): boolean {
    return this.config.approvalRequired
  }
}
