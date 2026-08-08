import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin-sdk'
import { verifySuperAdmin } from '@/lib/server/admin-guard'

/**
 * GET /api/admin/search?q=... - Searches across churches, users, payments, tickets
 */
export async function GET(req: NextRequest) {
  const authCheck = await verifySuperAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized Super Admin request' }, { status: 403 })
  }

  const queryParam = req.nextUrl.searchParams.get('q')?.toLowerCase()?.trim() || ''
  if (!queryParam) {
    return NextResponse.json({ success: true, results: { churches: [], users: [], payments: [], tickets: [] } })
  }

  try {
    const [churchesSnap, usersSnap, ticketsSnap] = await Promise.all([
      adminDb.collection('churches').get(),
      adminDb.collection('users').get(),
      adminDb.collection('platformSupportTickets').get(),
    ])

    const churches = churchesSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((c: any) =>
        c.name?.toLowerCase()?.includes(queryParam) ||
        c.slug?.toLowerCase()?.includes(queryParam) ||
        c.id?.toLowerCase()?.includes(queryParam)
      )
      .slice(0, 10)

    const users = usersSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((u: any) =>
        u.fullName?.toLowerCase()?.includes(queryParam) ||
        u.email?.toLowerCase()?.includes(queryParam) ||
        u.churchId?.toLowerCase()?.includes(queryParam)
      )
      .slice(0, 10)

    const tickets = ticketsSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((t: any) =>
        t.subject?.toLowerCase()?.includes(queryParam) ||
        t.churchName?.toLowerCase()?.includes(queryParam) ||
        t.userEmail?.toLowerCase()?.includes(queryParam)
      )
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      results: { churches, users, tickets },
    })
  } catch (err: any) {
    console.error('[API_ADMIN_SEARCH] GET error:', err)
    return NextResponse.json({ error: err?.message ?? 'Search query failed' }, { status: 500 })
  }
}
