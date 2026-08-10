import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { resolveFeatureAccess, FEATURE_TO_GLOBAL_FLAG } from '@/lib/server/feature-access'
import type { MachineFeatureKey } from '@/lib/config/pricing-matrix'

const ALL_FEATURE_KEYS = Object.keys(FEATURE_TO_GLOBAL_FLAG) as MachineFeatureKey[]

/**
 * GET /api/feature-access[?feature=sms]
 *
 * The single source of truth the client-side `useFeatureAccess` hook calls
 * — composes Global Feature Flag AND Plan Entitlement AND Role Permission
 * via resolveFeatureAccess() so the client and every server route agree.
 * Omit `feature` to receive the resolved map for every feature at once
 * (used by the hook on mount so pages don't each fire a separate request).
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.churchId) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  try {
    let rolePermissions: Record<string, Record<string, boolean>> | undefined
    if (adminDb) {
      const churchSnap = await adminDb.collection('churches').doc(authCheck.churchId).get()
      rolePermissions = churchSnap.exists ? churchSnap.data()?.rolePermissions : undefined
    }

    const featureKey = req.nextUrl.searchParams.get('feature') as MachineFeatureKey | null
    if (featureKey) {
      const result = await resolveFeatureAccess({
        churchId: authCheck.churchId,
        featureKey,
        role: authCheck.role,
        rolePermissions,
      })
      return NextResponse.json({ success: true, ...result })
    }

    const entries = await Promise.all(
      ALL_FEATURE_KEYS.map(async (key) => [
        key,
        await resolveFeatureAccess({ churchId: authCheck.churchId!, featureKey: key, role: authCheck.role, rolePermissions }),
      ] as const)
    )
    const features = Object.fromEntries(entries.map(([key, result]) => [key, result.allowed]))

    // Communications channels additionally depend on the platform having
    // real provider credentials configured — surfaced here so the compose
    // UI can disable a channel proactively rather than only discovering
    // "not configured" after attempting to send.
    let channelsConfigured = { whatsapp: false, email: false, sms: false }
    if (adminDb) {
      const infraSnap = await adminDb.collection('system').doc('infrastructure').get()
      const infra = infraSnap.exists ? infraSnap.data()! : {}
      channelsConfigured = {
        whatsapp: !!(infra.metaWhatsappToken && infra.metaWhatsappPhoneId),
        email: !!infra.resendKey,
        sms: !!infra.termiiKey,
      }
    }

    return NextResponse.json({ success: true, features, channelsConfigured })
  } catch (err: any) {
    console.error('[API_FEATURE_ACCESS] error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to resolve feature access.' }, { status: 500 })
  }
}
