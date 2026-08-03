import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Automation' }
export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Automation</h1><p className="page-description">Intelligent workflows that run while you sleep</p></div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm"><p className="text-muted-foreground">Automation Engine — coming in Stage 6</p></div>
    </div>
  )
}
