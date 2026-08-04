'use client'

import { BarChart3, Download, FileText, Sparkles, TrendingUp, Users, UserCheck } from 'lucide-react'
import { useChurchStore } from '@/store'
import { generateExecutiveReportPDF } from '@/lib/reports/generatePDF'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { church } = useChurchStore()

  const handleExportPDF = () => {
    generateExecutiveReportPDF({
      churchName: church?.name ?? 'Grace Church',
      logoUrl: church?.branding?.logoUrl,
      date: new Date().toLocaleDateString(),
      summary:
        '1. Visitor Retention: 85% of first-time guests received automated 24-hour follow-up messages.\n' +
        '2. Financial Giving: Tithes & offerings up 12% compared to last month\'s average.\n' +
        '3. Engagement Alert: 3 members flagged for pastoral check-in due to missed service attendance.',
      visitorsCount: 18,
      membersCount: 420,
      givingTotal: 250000,
    })
    toast.success('Executive PDF Report generated!')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Intelligence & Growth Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Automated ministry health reports for senior leadership of {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
        >
          <Download className="h-4 w-4" /> Download PDF Summary
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> Today&apos;s AI Executive Report
          </h2>

          <div className="rounded-xl border bg-muted/20 p-5 space-y-3 text-xs leading-relaxed">
            <p className="font-bold text-foreground">Executive Overview — {new Date().toLocaleDateString()}</p>
            <p>
              1. <strong>Visitor Retention:</strong> 85% of first-time guests received automated 24-hour follow-up messages.
            </p>
            <p>
              2. <strong>Financial Giving:</strong> Tithes & offerings up 12% compared to last month&apos;s average.
            </p>
            <p>
              3. <strong>Engagement Alert:</strong> 3 members flagged for pastoral check-in due to missed service attendance.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Growth Metrics</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Monthly Attendance</span>
              <span className="font-bold text-emerald-500">+14% Growth</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Visitor Conversion Rate</span>
              <span className="font-bold text-brand-500">62% Converted</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">AI Automation Score</span>
              <span className="font-bold text-purple-500">98 / 100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
