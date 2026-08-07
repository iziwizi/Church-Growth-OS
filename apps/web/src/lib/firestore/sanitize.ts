/**
 * sanitizeFirestoreData — recursively removes all `undefined` values from an object
 * before writing to Firestore. Firestore throws if any field value is `undefined`.
 *
 * undefined → null   (preserves the field but with a null marker)
 * nested objects are also sanitized recursively.
 */
export function sanitizeFirestoreData<T extends Record<string, unknown>>(data: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      sanitized[key] = null
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      // exclude Firestore FieldValue/Timestamp objects (they have a toDate or _methodName)
      typeof (value as any).toDate !== 'function' &&
      typeof (value as any)._methodName !== 'string'
    ) {
      sanitized[key] = sanitizeFirestoreData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}
