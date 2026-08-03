import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your church profile, branding, and integrations',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Configure your church profile, branding, and integrations</p>
        </div>
      </div>
      {children}
    </div>
  )
}
