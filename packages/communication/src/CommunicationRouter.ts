import type { CommunicationChannel } from '@church-growth-os/shared'
import { ProviderError } from '@church-growth-os/shared'
import type {
  IWhatsAppProvider,
  IEmailProvider,
  ISmsProvider,
  TenantProviderConfig,
  MessageResult,
  BroadcastResult,
  EmailBody,
  EmailOptions,
} from './interfaces'
import { MetaCloudProvider } from './providers/whatsapp/MetaCloudProvider'
import { ResendProvider } from './providers/email/ResendProvider'
import { TermiiProvider } from './providers/sms/TermiiProvider'

// ============================================================
// PROVIDER REGISTRY
// ============================================================

type WhatsAppProviderFactory = (config: Record<string, string>) => IWhatsAppProvider
type EmailProviderFactory = (config: Record<string, string>) => IEmailProvider
type SmsProviderFactory = (config: Record<string, string>) => ISmsProvider

const whatsappRegistry = new Map<string, WhatsAppProviderFactory>([
  ['meta_cloud', (cfg) => new MetaCloudProvider({
    phoneNumberId: cfg['phoneNumberId'] ?? '',
    accessToken: cfg['accessToken'] ?? '',
  })],
])

const emailRegistry = new Map<string, EmailProviderFactory>([
  ['resend', (cfg) => new ResendProvider({
    apiKey: cfg['apiKey'] ?? '',
    fromAddress: cfg['fromAddress'] ?? '',
  })],
])

const smsRegistry = new Map<string, SmsProviderFactory>([
  ['termii', (cfg) => new TermiiProvider({
    apiKey: cfg['apiKey'] ?? '',
    senderId: cfg['senderId'] ?? '',
  })],
])

/**
 * Register a new WhatsApp provider plugin.
 */
export function registerWhatsAppProvider(id: string, factory: WhatsAppProviderFactory): void {
  whatsappRegistry.set(id, factory)
}

export function registerEmailProvider(id: string, factory: EmailProviderFactory): void {
  emailRegistry.set(id, factory)
}

export function registerSmsProvider(id: string, factory: SmsProviderFactory): void {
  smsRegistry.set(id, factory)
}

// ============================================================
// COMMUNICATION ROUTER
// ============================================================

/**
 * CommunicationRouter routes all outgoing messages to the correct
 * provider based on the tenant's configuration.
 *
 * This is the ONLY entry point for sending communications.
 * Application code never imports providers directly.
 */
export class CommunicationRouter {
  private readonly config: TenantProviderConfig

  constructor(config: TenantProviderConfig) {
    this.config = config
  }

  private getWhatsAppProvider(): IWhatsAppProvider {
    const cfg = this.config.whatsapp
    if (!cfg) throw new ProviderError('whatsapp', 'No WhatsApp provider configured for this church')
    const factory = whatsappRegistry.get(cfg.providerId)
    if (!factory) throw new ProviderError('whatsapp', `Provider '${cfg.providerId}' is not registered`)
    return factory(cfg.config)
  }

  private getEmailProvider(): IEmailProvider {
    const cfg = this.config.email
    if (!cfg) throw new ProviderError('email', 'No email provider configured for this church')
    const factory = emailRegistry.get(cfg.providerId)
    if (!factory) throw new ProviderError('email', `Provider '${cfg.providerId}' is not registered`)
    return factory(cfg.config)
  }

  private getSmsProvider(): ISmsProvider {
    const cfg = this.config.sms
    if (!cfg) throw new ProviderError('sms', 'No SMS provider configured for this church')
    const factory = smsRegistry.get(cfg.providerId)
    if (!factory) throw new ProviderError('sms', `Provider '${cfg.providerId}' is not registered`)
    return factory(cfg.config)
  }

  // ── WhatsApp Methods ──────────────────────────────────────

  async sendWhatsApp(to: string, message: string): Promise<MessageResult> {
    return this.getWhatsAppProvider().sendMessage(to, message)
  }

  async broadcastWhatsApp(recipients: string[], message: string): Promise<BroadcastResult> {
    return this.getWhatsAppProvider().sendBroadcast(recipients, message)
  }

  // ── Email Methods ─────────────────────────────────────────

  async sendEmail(
    to: string,
    subject: string,
    body: EmailBody,
    options?: EmailOptions
  ): Promise<MessageResult> {
    return this.getEmailProvider().sendEmail(to, subject, body, options)
  }

  // ── SMS Methods ───────────────────────────────────────────

  async sendSms(to: string, message: string): Promise<MessageResult> {
    const result = await this.getSmsProvider().sendSms(to, message)
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: 'sms',
      timestamp: new Date(),
    }
  }

  async broadcastSms(recipients: string[], message: string): Promise<BroadcastResult> {
    return this.getSmsProvider().sendBulkSms(recipients, message)
  }

  // ── Generic Dispatch ──────────────────────────────────────

  async send(
    channel: CommunicationChannel,
    to: string,
    message: string,
    subject?: string
  ): Promise<MessageResult> {
    switch (channel) {
      case 'whatsapp':
        return this.sendWhatsApp(to, message)
      case 'email':
        return this.sendEmail(to, subject ?? 'Message from your church', { text: message })
      case 'sms':
        return this.sendSms(to, message)
    }
  }
}
