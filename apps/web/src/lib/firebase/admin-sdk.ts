/**
 * Firebase Admin SDK — Server-only.
 * NEVER import this file from client components.
 *
 * Next.js App Router does NOT execute API route bodies during build — only
 * at request time. In production (Vercel + GitHub Actions with secrets set),
 * the env vars FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and
 * FIREBASE_ADMIN_PRIVATE_KEY must be set.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    // During local dev without credentials, warn and use a stub
    // API routes guard for this with early 503 returns
    console.warn(
      '[Firebase Admin] Missing required env vars. Server-side APIs will return 503 until configured. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.'
    )
    // Return null cast to satisfy TypeScript — routes guard for null adminDb
    return null as any
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })
}

const _adminApp = getAdminApp()

export const adminApp = _adminApp
export const adminDb = _adminApp ? getFirestore(_adminApp) : (null as any)
export const adminAuth = _adminApp ? getAuth(_adminApp) : (null as any)

