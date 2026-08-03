import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Communications' }
export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Communications</h1><p className="page-description">Send WhatsApp, Email, and SMS broadcasts</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Communications module — coming in Stage 4</p></div>
    </div>
  )
}
