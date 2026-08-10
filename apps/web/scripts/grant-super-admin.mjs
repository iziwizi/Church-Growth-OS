#!/usr/bin/env node
/**
 * Grants (or revokes) platform Super Admin access for a Firebase user.
 *
 * This REPLACES the previous unauthenticated `/api/admin/bootstrap` route
 * and the hardcoded `admin@mujteknify.com` / password shipped in the
 * client bundle (see docs/PRODUCTION_ENGINEERING_AUDIT.md, findings S3/S4).
 * Super Admin must now be granted out-of-band by whoever holds the Firebase
 * Admin SDK service account credentials — never through a public endpoint.
 *
 * Usage (run from apps/web):
 *   node scripts/grant-super-admin.mjs <email> [--revoke]
 *
 * Requires the same server env vars used by the app's Admin SDK
 * (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * FIREBASE_ADMIN_PRIVATE_KEY), loaded from .env.local if present.
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = resolve(__dirname, '..', '.env.local')
  if (!existsSync(envPath)) return
  const contents = readFileSync(envPath, 'utf8')
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

const [, , emailArg, ...rest] = process.argv
const revoke = rest.includes('--revoke')

if (!emailArg) {
  console.error('Usage: node scripts/grant-super-admin.mjs <email> [--revoke]')
  process.exit(1)
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY.')
  console.error('Set these in apps/web/.env.local or your shell environment before running this script.')
  process.exit(1)
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

const auth = getAuth()
const db = getFirestore()

async function main() {
  const user = await auth.getUserByEmail(emailArg).catch((err) => {
    console.error(`No Firebase Auth user found for ${emailArg}: ${err.message}`)
    console.error('The user must sign up (create an account) before Super Admin can be granted.')
    process.exit(1)
  })

  await auth.setCustomUserClaims(user.uid, revoke ? { role: null, superAdmin: false } : { role: 'super_admin', superAdmin: true })

  await db.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email,
      role: revoke ? 'owner' : 'super_admin',
      isSuperAdmin: !revoke,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`${revoke ? 'Revoked' : 'Granted'} Super Admin for ${emailArg} (uid: ${user.uid}).`)
  console.log('The user must sign out and back in (or wait for their next token refresh) for the change to take effect.')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
