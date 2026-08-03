import type { IAIProvider, AIPrompt, AIResponse, AIChunk, ModelInfo } from '../interfaces'
import type { AIProviderType } from '@church-growth-os/shared'

/**
 * Anthropic Claude AI Provider (Default).
 * Uses the Messages API.
 */
export class ClaudeProvider implements IAIProvider {
  readonly providerId: AIProviderType = 'claude'
  readonly displayName = 'Claude (Anthropic)'
  readonly defaultModel = 'claude-3-5-sonnet-20241022'

  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.anthropic.com/v1'

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey
    this.model = config.model ?? this.defaultModel
  }

  async generate(prompt: AIPrompt): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: prompt.maxTokens ?? 4096,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
        temperature: prompt.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const err = (await response.json()) as { error?: { message: string } }
      throw new Error(`Claude API error: ${err.error?.message ?? response.statusText}`)
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>
      usage: { input_tokens: number; output_tokens: number }
      stop_reason: string
    }

    return {
      content: data.content[0]?.text ?? '',
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      model: this.model,
      provider: this.providerId,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'length',
    }
  }

  async *stream(prompt: AIPrompt): AsyncGenerator<AIChunk> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: prompt.maxTokens ?? 4096,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
        stream: true,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error('Claude streaming failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        yield { delta: '', finished: true }
        break
      }
      const text = decoder.decode(value)
      const lines = text.split('\n').filter((l: string) => l.startsWith('data: '))
      for (const line of lines) {
        try {
          const json = JSON.parse(line.slice(6)) as {
            type: string
            delta?: { text: string }
          }
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield { delta: json.delta.text, finished: false }
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }

  getTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.model,
      name: 'Claude 3.5 Sonnet',
      maxTokens: 8192,
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
    }
  }
}
