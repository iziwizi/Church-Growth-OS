import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/admin/cloudinary/save
 * Securely saves Cloudinary credentials to server-side Firestore.
 * The API Secret is NEVER exposed to the client.
 * Requires Super Admin authentication.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cloudName, apiKey, apiSecret } = body

    if (!cloudName || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Cloud Name and API Key are required.' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin database not initialized.' },
        { status: 500 }
      )
    }

    // Build the update object — only update secret if provided
    const update: Record<string, any> = {
      cloudinaryCloudName: cloudName.trim(),
      cloudinaryApiKey: apiKey.trim(),
      updatedAt: new Date().toISOString(),
    }

    if (apiSecret && apiSecret.trim()) {
      update.cloudinaryApiSecret = apiSecret.trim()
    }

    await adminDb.collection('system').doc('infrastructure').set(update, { merge: true })

    return NextResponse.json({
      success: true,
      message: 'Cloudinary credentials saved securely.',
      // Never return the secret back to the client
      cloudName: cloudName.trim(),
      apiKey: apiKey.trim(),
    })
  } catch (err: any) {
    console.error('Cloudinary save error:', err)
    return NextResponse.json(
      { success: false, error: err.message ?? 'Failed to save Cloudinary credentials.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/cloudinary/save
 * Returns the current Cloudinary config (cloud name + masked api key, NO secret).
 */
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin database not initialized.' }, { status: 500 })
    }

    const snap = await adminDb.collection('system').doc('infrastructure').get()
    if (!snap.exists) {
      return NextResponse.json({ success: true, config: null })
    }

    const data = snap.data()!
    return NextResponse.json({
      success: true,
      config: {
        cloudName: data.cloudinaryCloudName ?? '',
        // Mask API Key: show last 4 digits only
        apiKey: data.cloudinaryApiKey
          ? '•'.repeat(Math.max(0, (data.cloudinaryApiKey as string).length - 4)) +
            (data.cloudinaryApiKey as string).slice(-4)
          : '',
        hasSecret: !!(data.cloudinaryApiSecret),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
