import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'AI Studio' }
export default function AIStudioPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">AI Studio</h1><p className="page-description">AI-powered content generation for your ministry</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">AI Studio — coming in Stage 5</p></div>
    </div>
  )
}
