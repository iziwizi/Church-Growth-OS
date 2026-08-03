import type { IWhatsAppProvider, MessageResult, BroadcastResult, DeliveryStatus, MessageOptions } from '../../interfaces'

/**
 * Meta Cloud API (Business API) WhatsApp Provider.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class MetaCloudProvider implements IWhatsAppProvider {
  readonly providerId = 'meta_cloud'
  readonly displayName = 'Meta Cloud API'

  private readonly phoneNumberId: string
  private readonly accessToken: string
  private readonly baseUrl: string

  constructor(config: { phoneNumberId: string; accessToken: string }) {
    this.phoneNumberId = config.phoneNumberId
    this.accessToken = config.accessToken
    this.baseUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`
  }

  async sendMessage(
    to: string,
    message: string,
    _options?: MessageOptions
  ): Promise<MessageResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace('+', ''),
          type: 'text',
          text: { body: message },
        }),
      })

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>
        error?: { message: string }
      }

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message ?? 'Unknown error',
          provider: this.providerId,
          timestamp: new Date(),
        }
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        provider: this.providerId,
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        provider: this.providerId,
        timestamp: new Date(),
      }
    }
  }

  async sendTemplate(
    to: string,
    templateId: string,
    params: object[]
  ): Promise<MessageResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'template',
          template: {
            name: templateId,
            language: { code: 'en' },
            components: params,
          },
        }),
      })

      const data = (await response.json()) as { messages?: Array<{ id: string }>; error?: { message: string } }

      return {
        success: response.ok,
        messageId: data.messages?.[0]?.id,
        error: data.error?.message,
        provider: this.providerId,
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        provider: this.providerId,
        timestamp: new Date(),
      }
    }
  }

  async sendBroadcast(recipients: string[], message: string): Promise<BroadcastResult> {
    const results: MessageResult[] = []

    // Process in batches of 10 to respect rate limits
    const BATCH_SIZE = 10
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map((recipient) => this.sendMessage(recipient, message))
      )
      results.push(...batchResults)

      // Small delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return {
      total: recipients.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    // Meta Cloud API uses webhooks for delivery status
    // This method is a placeholder for webhook-driven status updates
    return {
      messageId,
      status: 'sent',
      timestamp: new Date(),
    }
  }
}
