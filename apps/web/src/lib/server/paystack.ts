import { adminDb } from '@/lib/firebase/admin-sdk'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export async function getPaystackSecretKey(): Promise<string | null> {
  try {
    if (adminDb) {
      const snap = await adminDb.collection('system').doc('infrastructure').get()
      const stored = snap.exists ? (snap.data()?.paystackSecret as string | undefined) : undefined
      if (stored) return stored
    }
  } catch (err) {
    console.error('[PAYSTACK] Failed to read secret key from Firestore:', err)
  }
  return process.env.PAYSTACK_SECRET_KEY ?? null
}

export interface InitializeTransactionParams {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export async function initializePaystackTransaction(secretKey: string, params: InitializeTransactionParams) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export async function verifyPaystackTransaction(secretKey: string, reference: string) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
