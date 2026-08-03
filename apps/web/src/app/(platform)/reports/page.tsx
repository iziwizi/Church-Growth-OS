import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Reports' }
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-description">Insights and analytics for ministry growth</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Reports module — coming in Stage 8</p></div>
    </div>
  )
}
