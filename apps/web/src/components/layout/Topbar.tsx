'use client'

import { Bell, Search, Moon, Sun, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logOut } from '@/lib/firebase/auth'
import { useAuthStore, useChurchStore } from '@/store'

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { user, role } = useAuthStore()
  const { church } = useChurchStore()

  const handleLogOut = async () => {
    try {
      await logOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

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
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Unread indicator */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {user?.displayName?.charAt(0)?.toUpperCase() ?? <User className="h-3 w-3" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none text-foreground">
              {user?.displayName ?? user?.email ?? 'User'}
            </p>
            <p className="mt-0.5 text-xs capitalize leading-none text-muted-foreground">
              {role?.replace('_', ' ') ?? 'Member'}
            </p>
          </div>
          <button
            onClick={handleLogOut}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
