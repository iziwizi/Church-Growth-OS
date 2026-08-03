import type { Metadata } from 'next'
import { DashboardView } from './DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your ministry command center — see what AI has accomplished today',
}

export default function DashboardPage() {
  return <DashboardView />
}
