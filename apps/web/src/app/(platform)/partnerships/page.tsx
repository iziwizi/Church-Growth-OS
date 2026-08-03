import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Partnerships' }
export default function PartnershipsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Partnerships</h1><p className="page-description">Grow and engage your ministry partners</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Partnerships module — coming in Stage 7</p></div>
    </div>
  )
}
