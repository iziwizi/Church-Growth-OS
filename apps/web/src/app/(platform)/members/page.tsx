import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Members' }

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-description">Manage your church membership database</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">Members module — coming in Stage 3</p>
      </div>
    </div>
  )
}
