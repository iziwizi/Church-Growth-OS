import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Visitors' }
export default function VisitorsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Visitors</h1><p className="page-description">Track and nurture first-time visitors</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Visitors module — coming in Stage 3</p></div>
    </div>
  )
}
