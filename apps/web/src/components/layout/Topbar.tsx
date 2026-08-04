'use client'

import { Search, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { NotificationCenter } from './NotificationCenter'
import { UserProfileDropdown } from './UserProfileDropdown'

export function Topbar() {
  const { theme, setTheme } = useTheme()


  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Left — Search trigger (placeholder) */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Search"
          className="flex h-9 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:block">Search...</span>
          <kbd className="ml-2 hidden rounded border bg-background px-1.5 py-0.5 text-xs font-mono sm:block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2.5">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  )
}
