import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Testimonies' }
export default function TestimoniesPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Testimonies</h1><p className="page-description">Collect and share ministry testimonies</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Testimonies module — coming in Stage 7</p></div>
    </div>
  )
}
