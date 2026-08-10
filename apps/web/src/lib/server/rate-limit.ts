/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * LIMITATION: state is per server instance/process. On multi-instance
 * serverless deployments (Vercel) this does not provide a global guarantee
 * — it is a stopgap against single-instance abuse and accidental retry
 * loops, not a substitute for a shared store (Upstash Redis, etc.) at
 * scale. See docs/PRODUCTION_READINESS_REPORT.md for the recommended
 * production replacement.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodically drop expired buckets so the map doesn't grow unbounded.
let lastSweep = Date.now()
function sweep() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweep()
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
