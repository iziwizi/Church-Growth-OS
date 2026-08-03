import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Donations' }
export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Donations</h1><p className="page-description">Track giving and manage financial campaigns</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Donations module — coming in Stage 7</p></div>
    </div>
  )
}
