import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Church Setup | Church Growth OS',
  description: 'Set up your church profile and configure your Church Growth OS.',
}

export const dynamic = 'force-dynamic'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-purple-950 flex flex-col items-center justify-center p-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>



      {/* Main content */}
      <main className="relative z-10 w-full flex justify-center">
        {children}
      </main>
    </div>
  )
}
