import { z } from 'zod'

// ============================================================
// WHATSAPP VALIDATION
// ============================================================

/**
 * Validates and normalises a phone number for WhatsApp.
 * Returns E.164 format (e.g. +2348012345678) or null if invalid.
 */
export function validateWhatsAppNumber(raw: string): {
  formatted: string | null
  status: 'verified' | 'invalid' | 'needs_review'
  reason?: string
} {
  // Strip everything except digits and leading +
  const cleaned = raw.trim().replace(/[\s\-().]/g, '')

  if (!cleaned) {
    return { formatted: null, status: 'invalid', reason: 'Empty number' }
  }

  // Must start with + or be a digit string
  const e164Regex = /^\+?[1-9]\d{6,14}$/
  if (!e164Regex.test(cleaned)) {
    return {
      formatted: null,
      status: 'invalid',
      reason: 'Does not match E.164 format',
    }
  }

  // Normalise: ensure leading +
  const normalised = cleaned.startsWith('+') ? cleaned : `+${cleaned}`

  // Detect missing country code (numbers shorter than 10 digits after +)
  const digits = normalised.replace('+', '')
  if (digits.length < 10) {
    return {
      formatted: normalised,
      status: 'needs_review',
      reason: 'Number may be missing country code',
    }
  }

  return { formatted: normalised, status: 'verified' }
}

/**
 * Batch validate an array of numbers, returning deduplication results.
 */
export function batchValidateWhatsAppNumbers(numbers: string[]): {
  valid: string[]
  invalid: string[]
  needsReview: string[]
  duplicates: string[]
} {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  const needsReview: string[] = []
  const duplicates: string[] = []

  for (const num of numbers) {
    const result = validateWhatsAppNumber(num)
    if (!result.formatted) {
      invalid.push(num)
      continue
    }
    if (seen.has(result.formatted)) {
      duplicates.push(num)
      continue
    }
    seen.add(result.formatted)
    if (result.status === 'verified') valid.push(result.formatted)
    else needsReview.push(result.formatted)
  }

  return { valid, invalid, needsReview, duplicates }
}

// ============================================================
// ZOD SCHEMAS — SHARED
// ============================================================

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export const churchIdSchema = z.object({
  churchId: z.string().min(1),
})

// ============================================================
// ZOD SCHEMAS — CHURCH
// ============================================================

export const churchBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  timezone: z.string().min(1),
  country: z.string().min(2).max(2),
  currency: z.string().min(3).max(3),
})

export const createChurchSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  country: z.string().min(2).max(2),
  timezone: z.string().min(1),
  plan: z.enum(['starter', 'growth', 'enterprise']).default('starter'),
})

// ============================================================
// ZOD SCHEMAS — MEMBER
// ============================================================

export const createMemberSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO string
  weddingAnniversary: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  cell: z.string().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  baptized: z.boolean().default(false),
})

export const updateMemberSchema = createMemberSchema.partial()

// ============================================================
// ZOD SCHEMAS — VISITOR
// ============================================================

export const createVisitorSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  dateOfFirstVisit: z.string(),
  howHeardAboutUs: z.string().optional(),
  interests: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
})

// ============================================================
// ZOD SCHEMAS — COMMUNICATION
// ============================================================

export const sendBroadcastSchema = z.object({
  name: z.string().min(1).max(100),
  channel: z.enum(['whatsapp', 'email', 'sms']),
  recipientType: z.enum(['all_members', 'segment', 'tags', 'manual']),
  tags: z.array(z.string()).optional(),
  recipientIds: z.array(z.string()).optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  scheduledAt: z.string().optional(),
})

// ============================================================
// ZOD SCHEMAS — AUTH
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// ============================================================
// UTILITY HELPERS
// ============================================================

/**
 * Generate a URL-safe slug from a church name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

/**
 * Build a consistent API response envelope.
 */
export function apiResponse<T>(
  data: T,
  meta?: { page?: number; total?: number; cursor?: string }
) {
  return { success: true, data, meta: meta ?? null, error: null }
}

export function apiError(message: string, code?: string) {
  return { success: false, data: null, meta: null, error: { message, code } }
}

/**
 * Format a currency amount with the church's currency code.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
