import type { AIProviderType, AITaskType } from '@church-growth-os/shared'

// ============================================================
// AI PROVIDER INTERFACE
// ============================================================

export interface AIPrompt {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}

export interface AIResponse {
  content: string
  tokensUsed: number
  model: string
  provider: AIProviderType
  finishReason: 'stop' | 'length' | 'error'
}

export interface AIChunk {
  delta: string
  finished: boolean
}

export interface ModelInfo {
  id: string
  name: string
  maxTokens: number
  inputCostPer1k: number
  outputCostPer1k: number
}

export interface IAIProvider {
  readonly providerId: AIProviderType
  readonly displayName: string
  readonly defaultModel: string
  generate(prompt: AIPrompt): Promise<AIResponse>
  stream(prompt: AIPrompt): AsyncGenerator<AIChunk>
  getTokenCount(text: string): number
  getModelInfo(): ModelInfo
}

// ============================================================
// AI TASK CONTEXT TYPES
// ============================================================

export interface ChurchContext {
  churchName: string
  denomination?: string
  country: string
  timezone: string
  primaryLanguage?: string
}

export interface SermonRepurposeInput {
  title: string
  preacher: string
  scriptures: string[]
  description: string
  keyPoints?: string[]
  rawTranscript?: string
}

export interface SermonRepurposeOutput {
  summary: string
  whatsappMessage: string
  emailSubject: string
  emailBody: string
  socialCaptions: Array<{ platform: string; caption: string }>
  prayerPoints: string[]
  keyQuotes: string[]
}

export interface FollowUpInput {
  visitorName: string
  dateOfFirstVisit: string
  howHeardAboutUs?: string
  interests?: string[]
  followUpNumber: number // 1st, 2nd, 3rd follow-up
}

export interface DeclarationInput {
  date: string
  scripture?: string
  theme?: string
  churchProvidedContent?: string
}

export interface BroadcastComposeInput {
  topic: string
  audience: string
  channel: 'whatsapp' | 'email' | 'sms'
  tone?: string
  additionalContext?: string
}

// ============================================================
// AI TASK REGISTRY TYPE
// ============================================================

export interface AITask<TInput, TOutput> {
  taskType: AITaskType
  buildPrompt(context: ChurchContext, input: TInput): AIPrompt
  parseOutput(raw: string): TOutput
}
