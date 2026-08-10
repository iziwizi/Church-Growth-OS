import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit'

function isNonEmptyString(value: unknown, maxLength = 5000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

export async function POST(req: NextRequest) {
  try {
    // Best-effort abuse throttle per IP across all public form types — see
    // docs/PRODUCTION_ENGINEERING_AUDIT.md §8 (no spam/rate protection existed).
    const rateLimit = checkRateLimit(`public-submit:${getClientIp(req)}`, 10, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { churchSlug, formType, data } = body

    if (!churchSlug || !formType || !data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Missing required parameters: churchSlug, formType, data' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database service is currently initializing.' },
        { status: 503 }
      )
    }

    // 1. Resolve church by slug
    const churchesRef = adminDb.collection('churches')
    let churchDoc = await churchesRef.where('slug', '==', String(churchSlug).toLowerCase().trim()).limit(1).get()

    if (churchDoc.empty) {
      // Fallback: try querying by document ID
      const directDoc = await churchesRef.doc(churchSlug).get()
      if (!directDoc.exists) {
        return NextResponse.json({ error: 'Church not found for slug: ' + churchSlug }, { status: 404 })
      }
      churchDoc = { docs: [directDoc] } as any
    }

    const churchId = churchDoc.docs[0]!.id
    const churchRef = churchesRef.doc(churchId)

    // In-app notifications live under the church's own subcollection — the
    // admin notification bell (NotificationCenter.tsx) only ever reads
    // `churches/{churchId}/notifications`, never the top-level collection.
    // A previous version wrote here, making every public-form notification
    // invisible to church admins (docs/PRODUCTION_ENGINEERING_AUDIT.md §8).
    async function notifyChurch(type: 'prayer' | 'alert' | 'testimony' | 'partnership', title: string, description: string) {
      await churchRef.collection('notifications').add({
        type,
        title,
        description: description.slice(0, 200),
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      }).catch((err: any) => console.error('[PUBLIC_SUBMIT] notification write failed:', err))
    }

    // 2. Route by form type
    switch (formType) {
      case 'prayer_request': {
        if (!isNonEmptyString(data.request) && !isNonEmptyString(data.description)) {
          return NextResponse.json({ error: 'A prayer request description is required.' }, { status: 400 })
        }
        const prayerRef = churchRef.collection('prayerRequests').doc()
        const requestText = (data.request ?? data.description ?? '').toString().trim().slice(0, 3000)
        await prayerRef.set({
          personName: isNonEmptyString(data.fullName, 200) ? data.fullName.trim() : 'Anonymous',
          email: isNonEmptyString(data.email, 200) ? data.email.trim() : null,
          phone: isNonEmptyString(data.phone, 40) ? data.phone.trim() : null,
          request: requestText,
          category: isNonEmptyString(data.category, 60) ? data.category : 'General',
          isPrivate: !!data.isPrivate,
          status: 'open',
          source: 'public_form',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        await notifyChurch('prayer', `New Prayer Request from ${isNonEmptyString(data.fullName, 200) ? data.fullName : 'a member'}`, requestText)

        return NextResponse.json({
          success: true,
          message: 'Prayer request submitted to pastoral prayer team.',
          id: prayerRef.id,
        })
      }

      case 'testimony': {
        const content = (data.content ?? data.testimony ?? '').toString().trim()
        if (!isNonEmptyString(content)) {
          return NextResponse.json({ error: 'A testimony is required.' }, { status: 400 })
        }
        const testRef = churchRef.collection('testimonies').doc()
        const authorName = isNonEmptyString(data.fullName, 200) ? data.fullName.trim() : 'Beloved Member'
        await testRef.set({
          authorName,
          email: isNonEmptyString(data.email, 200) ? data.email.trim() : null,
          phone: isNonEmptyString(data.phone, 40) ? data.phone.trim() : null,
          title: isNonEmptyString(data.title, 200) ? data.title.trim() : 'Thanksgiving & Testimony',
          content: content.slice(0, 5000),
          status: 'pending', // Pending pastoral approval before public sharing
          isPublic: false,
          source: 'public_form',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        await notifyChurch('testimony', `New Testimony from ${authorName}`, content)

        return NextResponse.json({
          success: true,
          message: 'Testimony submitted successfully. God bless you!',
          id: testRef.id,
        })
      }

      case 'partnership': {
        if (!isNonEmptyString(data.fullName, 200)) {
          return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
        }
        const partnerRef = churchRef.collection('partnerships').doc()
        await partnerRef.set({
          name: data.fullName.trim(),
          email: isNonEmptyString(data.email, 200) ? data.email.trim() : null,
          phone: isNonEmptyString(data.phone, 40) ? data.phone.trim() : null,
          tier: isNonEmptyString(data.tier, 100) ? data.tier : 'Covenant Partner',
          pledge: Number.isFinite(Number(data.pledge)) ? Number(data.pledge) : 0,
          notes: isNonEmptyString(data.notes, 2000) ? data.notes.trim() : null,
          status: 'pending', // Awaiting church admin activation
          source: 'public_form',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        await notifyChurch('partnership', `New Partnership Inquiry from ${data.fullName.trim()}`, `Tier: ${data.tier ?? 'Covenant Partner'}`)

        return NextResponse.json({
          success: true,
          message: 'Thank you for partnering with us! Our team will follow up shortly.',
          id: partnerRef.id,
        })
      }

      case 'visitor_checkin': {
        if (!isNonEmptyString(data.fullName, 200)) {
          return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
        }
        const visRef = churchRef.collection('visitors').doc()
        await visRef.set({
          fullName: data.fullName.trim(),
          email: isNonEmptyString(data.email, 200) ? data.email.trim() : null,
          phone: isNonEmptyString(data.phone, 40) ? data.phone.trim() : null,
          invitedBy: isNonEmptyString(data.invitedBy, 200) ? data.invitedBy : 'Walk-in',
          visitDate: data.visitDate ?? new Date().toISOString().split('T')[0]!,
          followUpStatus: 'new',
          followUpStage: 'stage_1',
          notes: isNonEmptyString(data.notes, 2000) ? data.notes : 'Submitted via public Sunday digital connect card',
          source: 'Public Connect Card',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        // Also record to unified people collection
        await churchRef.collection('people').add({
          fullName: data.fullName.trim(),
          email: isNonEmptyString(data.email, 200) ? data.email.trim() : null,
          phone: isNonEmptyString(data.phone, 40) ? data.phone.trim() : null,
          tags: ['visitor'],
          tag: 'visitor',
          visitDate: data.visitDate ?? new Date().toISOString().split('T')[0]!,
          source: 'Public Connect Card',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        await notifyChurch('alert', `New Visitor: ${data.fullName.trim()}`, 'Submitted a digital connect card.')

        return NextResponse.json({
          success: true,
          message: 'Welcome to our church! Your connect card has been received.',
          id: visRef.id,
        })
      }

      case 'contact': {
        const message = (data.message ?? '').toString().trim()
        if (!isNonEmptyString(message)) {
          return NextResponse.json({ error: 'A message is required.' }, { status: 400 })
        }
        await notifyChurch(
          'alert',
          `New Message from ${isNonEmptyString(data.fullName, 200) ? data.fullName : 'Website Visitor'}`,
          `${message} (${data.email ?? data.phone ?? 'No contact'})`
        )

        return NextResponse.json({
          success: true,
          message: 'Message sent to church administration.',
        })
      }

      default:
        return NextResponse.json({ error: `Unsupported formType: ${formType}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Public submission error:', err)
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 500 })
  }
}
