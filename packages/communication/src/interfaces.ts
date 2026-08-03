import type { CommunicationChannel } from '@church-growth-os/shared'

// ============================================================
// RESULT TYPES
// ============================================================

export interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
  provider: string
  timestamp: Date
}

export interface BroadcastResult {
  total: number
  sent: number
  failed: number
  results: MessageResult[]
}

export interface DeliveryStatus {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp?: Date
}

export interface EmailBody {
  text?: string
  html?: string
}

export interface EmailRecipient {
  email: string
  name?: string
  variables?: Record<string, string>
}

export interface EmailTemplate {
  subject: string
  body: EmailBody
}

export interface BulkEmailResult {
  total: number
  sent: number
  failed: number
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BalanceResult {
  balance: number
  currency: string
}

// ============================================================
// OPTIONS
// ============================================================

export interface MessageOptions {
  mediaUrl?: string
  replyToMessageId?: string
  footer?: string
}

export interface EmailOptions {
  replyTo?: string
  cc?: string[]
  attachments?: Array<{ filename: string; content: string; contentType: string }>
  tags?: string[]
}

// ============================================================
// PROVIDER INTERFACES
// ============================================================

export interface IWhatsAppProvider {
  readonly providerId: string
  readonly displayName: string
  sendMessage(to: string, message: string, options?: MessageOptions): Promise<MessageResult>
  sendTemplate(to: string, templateId: string, params: object[]): Promise<MessageResult>
  sendBroadcast(recipients: string[], message: string): Promise<BroadcastResult>
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>
}

export interface IEmailProvider {
  readonly providerId: string
  readonly displayName: string
  sendEmail(
    to: string,
    subject: string,
    body: EmailBody,
    options?: EmailOptions
  ): Promise<MessageResult>
  sendBulk(recipients: EmailRecipient[], template: EmailTemplate): Promise<BulkEmailResult>
}

export interface ISmsProvider {
  readonly providerId: string
  readonly displayName: string
  sendSms(to: string, message: string): Promise<SmsResult>
  sendBulkSms(recipients: string[], message: string): Promise<BroadcastResult>
  getBalance(): Promise<BalanceResult>
}

// ============================================================
// PROVIDER REGISTRY TYPES
// ============================================================

export interface ProviderRegistration<T> {
  id: string
  channel: CommunicationChannel
  displayName: string
  configSchema: object
  factory: (config: Record<string, string>) => T
}

export interface TenantProviderConfig {
  whatsapp?: { providerId: string; config: Record<string, string> }
  email?: { providerId: string; config: Record<string, string> }
  sms?: { providerId: string; config: Record<string, string> }
}
