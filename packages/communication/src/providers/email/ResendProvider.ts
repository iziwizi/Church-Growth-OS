import type { IEmailProvider, MessageResult, EmailBody, EmailRecipient, EmailTemplate, BulkEmailResult, EmailOptions } from '../../interfaces'

/**
 * Resend Email Provider.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendProvider implements IEmailProvider {
  readonly providerId = 'resend'
  readonly displayName = 'Resend'

  private readonly apiKey: string
  private readonly fromAddress: string
  private readonly baseUrl = 'https://api.resend.com'

  constructor(config: { apiKey: string; fromAddress: string }) {
    this.apiKey = config.apiKey
    this.fromAddress = config.fromAddress
  }

  async sendEmail(
    to: string,
    subject: string,
    body: EmailBody,
    options?: EmailOptions
  ): Promise<MessageResult> {
    try {
      const payload: Record<string, unknown> = {
        from: this.fromAddress,
        to: [to],
        subject,
        ...(body.html ? { html: body.html } : {}),
        ...(body.text ? { text: body.text } : {}),
        ...(options?.replyTo ? { reply_to: options.replyTo } : {}),
        ...(options?.cc ? { cc: options.cc } : {}),
        ...(options?.tags ? { tags: options.tags.map((t: string) => ({ name: t, value: 'true' })) } : {}),
      }

      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { id?: string; message?: string }

      if (!response.ok) {
        return {
          success: false,
          error: data.message ?? 'Email send failed',
          provider: this.providerId,
          timestamp: new Date(),
        }
      }

      return {
        success: true,
        messageId: data.id,
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

  async sendBulk(recipients: EmailRecipient[], template: EmailTemplate): Promise<BulkEmailResult> {
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.sendEmail(recipient.email, template.subject, template.body)
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<MessageResult>).value.success).length
    const failed = recipients.length - sent

    return { total: recipients.length, sent, failed }
  }
}
