import type { Metadata } from 'next'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { AuthInitializer } from '@/components/auth/AuthInitializer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    template: '%s | Church Growth OS',
    default: 'Dashboard | Church Growth OS',
  },
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthInitializer>
      <PlatformShell>{children}</PlatformShell>
    </AuthInitializer>
  )
}
