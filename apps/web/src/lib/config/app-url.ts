import { NextRequest } from 'next/server'

/**
 * Returns the canonical application URL, guaranteeing no localhost in production.
 */
export function getAppUrl(req?: NextRequest): string {
  // 1. If explicit environment variable is set and not placeholder
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '')
  }

  // 2. Extract host from incoming request headers (works on Vercel / Cloud Run / custom domains)
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`.replace(/\/$/, '')
    }
  }

  // 3. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  }

  // 4. Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://church-growth-os-web.vercel.app'
  }

  // 5. Development local fallback
  return (envUrl || 'http://localhost:3000').replace(/\/$/, '')
}
