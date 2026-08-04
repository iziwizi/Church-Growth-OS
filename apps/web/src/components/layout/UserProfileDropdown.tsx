'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User, Church as ChurchIcon, Sparkles } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { logOut } from '@/lib/firebase/auth'
import { useAuthStore, useChurchStore } from '@/store'

export function UserProfileDropdown() {
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

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'P'
  const roleLabel = role ? role.replace('_', ' ') : 'Owner'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-1.5 pr-3 transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="User profile"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 font-display text-xs font-bold text-white shadow-xs">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
              {user?.displayName ?? user?.email?.split('@')[0] ?? 'Pastor'}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize leading-none mt-0.5">
              {roleLabel}
            </p>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-md outline-none animate-in fade-in-50 zoom-in-95"
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b mb-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.displayName ?? 'Pastor'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            {church && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-brand-50/50 dark:bg-brand-950/40 px-2 py-1 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                <ChurchIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{church.name}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Settings & Preferences
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/setup"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent cursor-pointer"
            >
              <ChurchIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Church Setup Wizard
            </Link>
          </DropdownMenu.Item>



          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onClick={handleLogOut}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive outline-none transition-colors hover:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
