import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Live Service' }
export default function LiveServicePage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Live Service</h1><p className="page-description">Automate live streaming and engagement</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Live Service module — coming in Stage 3</p></div>
    </div>
  )
}
