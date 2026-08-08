import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { churchSlug, formType, data } = body

    if (!churchSlug || !formType || !data) {
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
    let churchDoc = await churchesRef.where('slug', '==', churchSlug.toLowerCase().trim()).limit(1).get()

    if (churchDoc.empty) {
      // Fallback: try querying by document ID
      const directDoc = await churchesRef.doc(churchSlug).get()
      if (!directDoc.exists) {
        return NextResponse.json({ error: 'Church not found for slug: ' + churchSlug }, { status: 404 })
      }
      churchDoc = { docs: [directDoc] } as any
    }

    const churchId = churchDoc.docs[0]!.id
    const churchData = churchDoc.docs[0]!.data()
    const churchRef = churchesRef.doc(churchId)

    // 2. Route by form type
    switch (formType) {
      case 'prayer_request': {
        const prayerRef = churchRef.collection('prayerRequests').doc()
        await prayerRef.set({
          personName: data.fullName ?? 'Anonymous',
          email: data.email ?? null,
          phone: data.phone ?? null,
          request: data.request ?? data.description ?? '',
          category: data.category ?? 'General',
          isPrivate: !!data.isPrivate,
          status: 'open',
          source: 'public_form',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        // Also record in notifications
        await adminDb.collection('notifications').add({
          churchId,
          userId: churchData.ownerId,
          type: 'prayer_request',
          title: `New Prayer Request from ${data.fullName ?? 'a member'}`,
          message: data.request?.slice(0, 100) ?? '',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({
          success: true,
          message: 'Prayer request submitted to pastoral prayer team.',
          id: prayerRef.id,
        })
      }

      case 'testimony': {
        const testRef = churchRef.collection('testimonies').doc()
        await testRef.set({
          personName: data.fullName ?? 'Beloved Member',
          email: data.email ?? null,
          phone: data.phone ?? null,
          title: data.title ?? 'Thanksgiving & Testimony',
          content: data.content ?? data.testimony ?? '',
          status: 'pending', // Pending pastoral approval before public sharing
          isPublic: false,
          source: 'public_form',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({
          success: true,
          message: 'Testimony submitted successfully. God bless you!',
          id: testRef.id,
        })
      }

      case 'visitor_checkin': {
        const visRef = churchRef.collection('visitors').doc()
        await visRef.set({
          fullName: data.fullName ?? '',
          email: data.email ?? null,
          phone: data.phone ?? null,
          invitedBy: data.invitedBy ?? 'Walk-in',
          visitDate: data.visitDate ?? new Date().toISOString().split('T')[0]!,
          followUpStatus: 'new',
          followUpStage: 'stage_1',
          notes: data.notes ?? 'Submitted via public Sunday digital connect card',
          source: 'Public Connect Card',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        // Also record to unified people collection
        await churchRef.collection('people').add({
          fullName: data.fullName ?? '',
          email: data.email ?? null,
          phone: data.phone ?? null,
          tags: ['visitor'],
          tag: 'visitor',
          visitDate: data.visitDate ?? new Date().toISOString().split('T')[0]!,
          source: 'Public Connect Card',
          churchId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({
          success: true,
          message: 'Welcome to our church! Your connect card has been received.',
          id: visRef.id,
        })
      }

      case 'contact': {
        await adminDb.collection('notifications').add({
          churchId,
          userId: churchData.ownerId,
          type: 'contact_message',
          title: `New Message from ${data.fullName ?? 'Website Visitor'}`,
          message: `${data.message ?? ''} (${data.email ?? data.phone ?? 'No contact'})`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })

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
