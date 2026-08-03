import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Church Setup | Church Growth OS',
  description: 'Set up your church profile and configure your Church Growth OS.',
}

export const dynamic = 'force-dynamic'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-purple-950">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="text-sm font-semibold text-white">Church Growth OS</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-start justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
