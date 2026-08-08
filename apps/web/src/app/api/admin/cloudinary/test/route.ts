import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'

/**
 * POST /api/admin/cloudinary/test
 * Tests Cloudinary credentials by calling the Cloudinary Admin API.
 * Reads credentials securely from server-side Firestore.
 * Never exposes credentials to the client.
 */
export async function POST() {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin database not initialized.' },
        { status: 500 }
      )
    }

    // Load credentials from server-side Firestore
    const snap = await adminDb.collection('system').doc('infrastructure').get()
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'No Cloudinary credentials found. Please save credentials first.' },
        { status: 400 }
      )
    }

    const data = snap.data()!
    const cloudName = data.cloudinaryCloudName as string
    const apiKey = data.cloudinaryApiKey as string
    const apiSecret = data.cloudinaryApiSecret as string

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Incomplete Cloudinary credentials. Cloud Name, API Key, and API Secret are all required.' },
        { status: 400 }
      )
    }

    // Call Cloudinary Admin API to verify credentials
    // Uses the /usage endpoint which returns account usage stats
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const testRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    })

    if (!testRes.ok) {
      const errText = await testRes.text()
      return NextResponse.json(
        {
          success: false,
          error: `Cloudinary authentication failed (status ${testRes.status}). Check your credentials.`,
          detail: errText,
        },
        { status: 400 }
      )
    }

    const usage = await testRes.json()

    return NextResponse.json({
      success: true,
      message: `✅ Cloudinary connected successfully! Cloud: ${cloudName}`,
      usage: {
        plan: usage.plan ?? 'Unknown',
        credits: {
          used: usage.credits?.usage ?? 0,
          limit: usage.credits?.limit ?? 0,
        },
        storage: {
          usedGb: ((usage.storage?.usage ?? 0) / (1024 * 1024 * 1024)).toFixed(2),
          limitGb: ((usage.storage?.limit ?? 0) / (1024 * 1024 * 1024)).toFixed(2),
        },
        bandwidth: {
          usedGb: ((usage.bandwidth?.usage ?? 0) / (1024 * 1024 * 1024)).toFixed(2),
          limitGb: ((usage.bandwidth?.limit ?? 0) / (1024 * 1024 * 1024)).toFixed(2),
        },
        resources: usage.resources ?? 0,
        transformations: usage.transformations?.usage ?? 0,
      },
    })
  } catch (err: any) {
    console.error('Cloudinary test error:', err)
    return NextResponse.json(
      { success: false, error: err.message ?? 'Cloudinary test request failed.' },
      { status: 500 }
    )
  }
}
