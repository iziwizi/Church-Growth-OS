import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/upload/delete
 * Server-side Cloudinary asset deletion using signed API.
 * Requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET server env vars.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json() as { publicId?: string }

    if (!publicId) {
      return NextResponse.json({ error: 'publicId is required' }, { status: 400 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
    }

    const timestamp = Math.round(Date.now() / 1000)

    // Generate SHA-1 signature for Cloudinary signed requests
    const crypto = await import('crypto')
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    const formData = new URLSearchParams({
      public_id: publicId,
      signature,
      api_key: apiKey,
      timestamp: String(timestamp),
    })

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }
    )

    const data = await response.json() as { result?: string }

    if (data.result === 'ok' || data.result === 'not found') {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
