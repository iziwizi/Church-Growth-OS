import { NextRequest, NextResponse } from 'next/server'
import { generateAndDeliverDailyReport } from '@/lib/server/daily-report'
import { verifyAuthenticatedUser } from '@/lib/server/auth-guard'
import { checkRateLimit } from '@/lib/server/rate-limit'

/**
 * POST /api/church/daily-report/generate
 * Generates and delivers the 6:00 AM Executive Daily Growth Report on demand.
 */
export async function POST(req: NextRequest) {
  const authCheck = await verifyAuthenticatedUser(req)
  if (!authCheck.authorized || !authCheck.uid) {
    return NextResponse.json({ error: authCheck.error ?? 'Authentication required.' }, { status: 401 })
  }

  try {
    const { churchId } = await req.json()
    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required.' }, { status: 400 })
    }
    if (authCheck.role !== 'super_admin' && churchId !== authCheck.churchId) {
      return NextResponse.json({ error: 'You are not authorized to generate a report for this church.' }, { status: 403 })
    }

    const rateLimit = checkRateLimit(`daily-report:${churchId}`, 3, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Report generation was just triggered. Please wait a moment before trying again.' }, { status: 429 })
    }

    const result = await generateAndDeliverDailyReport(churchId)
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Generation failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '☀️ Daily Executive Growth Report generated and dispatched successfully.',
      report: result.report,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
