import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Prayer Requests' }
export default function PrayerRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Prayer Requests</h1><p className="page-description">Manage and respond to congregation prayer needs</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Prayer Requests module — coming in Stage 3</p></div>
    </div>
  )
}
