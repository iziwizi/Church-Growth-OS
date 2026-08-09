// ============================================================
// CLOUDINARY UPLOAD SERVICE
// Uploads media directly to Cloudinary via the unsigned Upload API.
// For production use, prefer signed uploads via a server-side endpoint.
// ============================================================

import type { IUploadService, UploadOptions, UploadResult } from './interfaces'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const API_KEY = process.env.CLOUDINARY_API_KEY ?? ''

// Cloudinary upload preset — set to "unsigned" for client-side uploads.
// Create an unsigned preset in your Cloudinary dashboard:
// Settings → Upload → Upload Presets → Add unsigned preset
const UPLOAD_PRESET = 'church_growth_os'

export class CloudinaryUploadService implements IUploadService {
  private readonly cloudName: string
  private readonly uploadPreset: string
  private readonly baseUploadUrl: string
  private readonly baseFetchUrl: string

  constructor(cloudName = CLOUD_NAME, uploadPreset = UPLOAD_PRESET) {
    this.cloudName = cloudName
    this.uploadPreset = uploadPreset
    this.baseUploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`
    this.baseFetchUrl = `https://res.cloudinary.com/${this.cloudName}`
  }

  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.cloudName) {
      throw new Error('Cloudinary cloud name is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.')
    }

    // Validate file size client-side
    if (options.maxBytes && file.size > options.maxBytes) {
      throw new Error(`File too large. Maximum size: ${Math.round(options.maxBytes / 1024 / 1024)} MB`)
    }

    // Validate file format if specified
    if (options.allowedFormats && file instanceof File) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!options.allowedFormats.includes(ext)) {
        throw new Error(`File format not allowed. Accepted: ${options.allowedFormats.join(', ')}`)
      }
    }

    const resourceType = this.detectResourceType(file)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)

    if (options.folder) formData.append('folder', options.folder)
    if (options.publicId) formData.append('public_id', options.publicId)
    if (options.tags?.length) formData.append('tags', options.tags.join(','))
    if (options.transformation) formData.append('eager', options.transformation)

    const response = await fetch(`${this.baseUploadUrl}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      throw new Error(errorData.error?.message ?? `Cloudinary upload failed: ${response.statusText}`)
    }

    const data = await response.json() as {
      secure_url: string
      public_id: string
      width?: number
      height?: number
      format?: string
      bytes?: number
      resource_type: string
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      resourceType: (data.resource_type as UploadResult['resourceType']) ?? 'image',
    }
  }

  async delete(publicId: string): Promise<void> {
    // Deletion requires server-side signing — call via API route
    const response = await fetch('/api/upload/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete asset: ${publicId}`)
    }
  }

  buildUrl(publicId: string, transformations?: string): string {
    if (!publicId) return ''
    const transform = transformations ? `${transformations}/` : ''
    return `${this.baseFetchUrl}/image/upload/${transform}${publicId}`
  }

  getChurchFolder(
    churchId: string,
    category: 'branding' | 'members' | 'sermons' | 'events' | 'documents' | 'support' | 'reports' | 'communications' | 'store'
  ): string {
    return `churches/${churchId}/${category}`
  }

  private detectResourceType(file: File | Blob): 'image' | 'video' | 'raw' {
    const type = file.type ?? ''
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/') || type.startsWith('audio/')) return 'video'
    return 'raw'
  }
}

// ── Singleton instance ────────────────────────────────────────
export const uploadService: IUploadService = new CloudinaryUploadService()
