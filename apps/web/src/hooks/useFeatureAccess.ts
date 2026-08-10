'use client'

import { useEffect, useState } from 'react'
import { useChurchStore } from '@/store'
import { getIdToken } from '@/lib/firebase/auth'
import { PLAN_FEATURE_MATRIX, type MachineFeatureKey } from '@/lib/config/pricing-matrix'

/**
 * Client-side hook for checking feature access.
 *
 * `hasFeature(key)` is a synchronous, client-bundle estimate (plan tier
 * only) — fine for instant cosmetic UI (locking a tab, dimming a button)
 * but NOT a security boundary, since it can't see the platform-wide
 * Global Feature Flag or the church's role-permission matrix.
 *
 * `authoritative` is the real answer from resolveFeatureAccess() on the
 * server (GET /api/feature-access) — Global Flag AND Plan Entitlement AND
 * Role Permission — fetched once per church and used by anything that
 * actually needs to be correct (page-level gating, disabling a send
 * action). It starts empty and fills in shortly after mount; treat a
 * missing key as "not yet loaded", not as "denied".
 */
export function useFeatureAccess() {
  const { church } = useChurchStore()
  const [authoritative, setAuthoritative] = useState<Record<string, boolean>>({})
  const [authoritativeLoaded, setAuthoritativeLoaded] = useState(false)
  const [channelsConfigured, setChannelsConfigured] = useState({ whatsapp: true, email: true, sms: true })

  const anyChurch = church as any
  const planId: string =
    anyChurch?.subscription?.planId || anyChurch?.plan || 'free_trial'

  useEffect(() => {
    if (!church?.id) return
    let cancelled = false
    setAuthoritativeLoaded(false)
    ;(async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) return
        const res = await fetch('/api/feature-access', {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const data = await res.json()
        if (!cancelled && res.ok && data.success) {
          setAuthoritative(data.features ?? {})
          if (data.channelsConfigured) setChannelsConfigured(data.channelsConfigured)
        }
      } catch (err) {
        console.warn('[useFeatureAccess] Could not load authoritative feature map:', err)
      } finally {
        if (!cancelled) setAuthoritativeLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [church?.id])

  const hasFeature = (key: MachineFeatureKey): boolean => {
    // 1. Direct custom feature overrides on church if present
    if (anyChurch?.featureOverrides && typeof anyChurch.featureOverrides[key] === 'boolean') {
      return anyChurch.featureOverrides[key]
    }

    // 2. Custom plan features from church subscription
    if (anyChurch?.subscription?.featureMap && typeof anyChurch.subscription.featureMap[key] === 'boolean') {
      return anyChurch.subscription.featureMap[key]
    }

    // 3. Fallback to canonical tier matrix
    const tierMatrix = PLAN_FEATURE_MATRIX[planId] || PLAN_FEATURE_MATRIX.free_trial
    return tierMatrix[key] ?? false
  }

  /** The authoritative, server-verified answer — use this to gate actions, not just hide UI. */
  const isFeatureAllowed = (key: MachineFeatureKey): boolean => {
    if (!authoritativeLoaded) return hasFeature(key) // instant estimate while loading
    return authoritative[key] ?? hasFeature(key)
  }

  return {
    planId,
    hasFeature,
    isFeatureAllowed,
    authoritativeLoaded,
    channelsConfigured,
    isTrial: planId === 'free_trial' || anyChurch?.subscription?.status === 'trialing',
    planName: planId.replace('_', ' ').toUpperCase(),
  }
}
