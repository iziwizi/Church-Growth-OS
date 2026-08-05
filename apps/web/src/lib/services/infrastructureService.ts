import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export interface InfrastructureConfig {
  deepseekKey?: string
  claudeKey?: string
  openaiKey?: string
  geminiKey?: string
  cloudinaryCloudName?: string
  cloudinaryApiKey?: string
  cloudinaryApiSecret?: string
  resendKey?: string
  metaWhatsappToken?: string
  metaWhatsappPhoneId?: string
  termiiKey?: string
  paystackSecret?: string
  flutterwaveSecret?: string
  stripeSecret?: string
  [key: string]: string | undefined
}

export async function getInfrastructureConfig(): Promise<InfrastructureConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'system', 'infrastructure'))
    if (snap.exists()) {
      return snap.data() as InfrastructureConfig
    }
    return null
  } catch (err) {
    console.warn('Could not load system/infrastructure secrets:', err)
    return null
  }
}
