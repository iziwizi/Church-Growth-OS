import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Events' }
export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Events</h1><p className="page-description">Plan and automate event promotion</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Events module — coming in Stage 3</p></div>
    </div>
  )
}
