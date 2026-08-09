import { NextRequest, NextResponse } from 'next/server'
import { generateAndDeliverDailyReport } from '@/lib/server/daily-report'

/**
 * POST /api/church/daily-report/generate
 * Generates and delivers the 6:00 AM Executive Daily Growth Report on demand.
 */
export async function POST(req: NextRequest) {
  try {
    const { churchId } = await req.json()
    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required.' }, { status: 400 })
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
