import { getIdToken } from '@/lib/firebase/auth'

/**
 * Wrapper around `fetch` for calling `/api/admin/*` routes, which now
 * require a verified Firebase ID token (see lib/server/admin-guard.ts —
 * `verifySuperAdmin` used to authorize every request by default; it now
 * default-denies and requires a real Bearer token). Use this instead of a
 * bare `fetch` for any Super Admin console API call.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const idToken = await getIdToken()
  const headers = new Headers(init.headers)
  if (idToken) headers.set('Authorization', `Bearer ${idToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(input, { ...init, headers })
}
