import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Sermons' }
export default function SermonsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Sermons</h1><p className="page-description">Upload and repurpose your sermon content</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Sermons module — coming in Stage 3</p></div>
    </div>
  )
}
