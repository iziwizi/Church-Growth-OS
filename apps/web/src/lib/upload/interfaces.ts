// ============================================================
// UPLOAD SERVICE — Cloudinary Provider
// Cloudinary is the ONLY media provider for Church Growth OS.
// Firestore stores only URLs — never raw binary data.
// ============================================================

export interface UploadResult {
  url: string           // Full public HTTPS URL (stored in Firestore)
  publicId: string      // Cloudinary public_id for future deletion/transformation
  width?: number
  height?: number
  format?: string
  bytes?: number
  resourceType: 'image' | 'video' | 'raw'
}

export interface UploadOptions {
  folder?: string           // e.g. "churches/{churchId}/logos"
  publicId?: string         // Override auto-generated ID
  transformation?: string   // Cloudinary eager transformation string
  allowedFormats?: string[] // e.g. ['jpg', 'png', 'webp']
  maxBytes?: number         // Client-side validation before upload
  tags?: string[]           // Cloudinary tags for organization
}

export interface IUploadService {
  upload(file: File | Blob, options?: UploadOptions): Promise<UploadResult>
  delete(publicId: string): Promise<void>
  buildUrl(publicId: string, transformations?: string): string
  getChurchFolder(
    churchId: string,
    category: 'branding' | 'members' | 'sermons' | 'events' | 'documents' | 'support' | 'reports' | 'communications'
  ): string
}
