'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

interface PlatformShellProps {
  children: React.ReactNode
}

export function PlatformShell({ children }: PlatformShellProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="relative flex h-svh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
        )}
      >
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Mobile navigation overlay */}
      <MobileNav />
    </div>
  )
}
