import type { ISmsProvider, SmsResult, BroadcastResult, BalanceResult, MessageResult } from '../../interfaces'

/**
 * Termii SMS Provider.
 * Docs: https://developer.termii.com
 */
export class TermiiProvider implements ISmsProvider {
  readonly providerId = 'termii'
  readonly displayName = 'Termii'

  private readonly apiKey: string
  private readonly senderId: string
  private readonly baseUrl = 'https://api.ng.termii.com/api'

  constructor(config: { apiKey: string; senderId: string }) {
    this.apiKey = config.apiKey
    this.senderId = config.senderId
  }

  async sendSms(to: string, message: string): Promise<SmsResult> {
    try {
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.replace('+', ''),
          from: this.senderId,
          sms: message,
          type: 'plain',
          api_key: this.apiKey,
          channel: 'generic',
        }),
      })

      const data = (await response.json()) as { message_id?: string; code?: string; message?: string }

      if (!response.ok || data.code === 'error') {
        return { success: false, error: data.message ?? 'Send failed' }
      }

      return { success: true, messageId: data.message_id }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async sendBulkSms(recipients: string[], message: string): Promise<BroadcastResult> {
    const results: MessageResult[] = []

    for (const recipient of recipients) {
      const result = await this.sendSms(recipient, message)
      results.push({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        provider: this.providerId,
        timestamp: new Date(),
      })
    }

    return {
      total: recipients.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  }

  async getBalance(): Promise<BalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/get-balance`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ api_key: this.apiKey }),
      })
      const data = (await response.json()) as { balance?: number; currency?: string }
      return { balance: data.balance ?? 0, currency: data.currency ?? 'NGN' }
    } catch {
      return { balance: 0, currency: 'NGN' }
    }
  }
}
