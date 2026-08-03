import type { IAIProvider, AIPrompt, AIResponse, AIChunk, ModelInfo } from '../interfaces'
import type { AIProviderType } from '@church-growth-os/shared'

/**
 * OpenAI Provider (GPT-4o / GPT-4o-mini).
 */
export class OpenAIProvider implements IAIProvider {
  readonly providerId: AIProviderType = 'openai'
  readonly displayName = 'OpenAI'
  readonly defaultModel = 'gpt-4o-mini'

  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey
    this.model = config.model ?? this.defaultModel
  }

  async generate(prompt: AIPrompt): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: prompt.maxTokens ?? 4096,
        temperature: prompt.temperature ?? 0.7,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
      }),
    })

    if (!response.ok) {
      const err = (await response.json()) as { error?: { message: string } }
      throw new Error(`OpenAI API error: ${err.error?.message ?? response.statusText}`)
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string }; finish_reason: string }>
      usage: { total_tokens: number }
    }

    return {
      content: data.choices[0]?.message.content ?? '',
      tokensUsed: data.usage.total_tokens,
      model: this.model,
      provider: this.providerId,
      finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : 'length',
    }
  }

  async *stream(_prompt: AIPrompt): AsyncGenerator<AIChunk> {
    // Placeholder — streaming implementation follows same pattern as Claude
    yield { delta: '', finished: true }
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4)
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.model,
      name: 'GPT-4o Mini',
      maxTokens: 16384,
      inputCostPer1k: 0.00015,
      outputCostPer1k: 0.0006,
    }
  }
}
