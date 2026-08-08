'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Moon, Sun, X, Users, UserPlus, HandHeart, MessageSquare, Sparkles, BookOpen, Calendar, Settings, BarChart3, ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useChurchStore } from '@/store'
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { NotificationCenter } from './NotificationCenter'
import { UserProfileDropdown } from './UserProfileDropdown'

// Nav shortcuts always visible in command search
const NAV_SHORTCUTS = [
  { label: 'Members Directory', href: '/members', icon: Users, category: 'Navigation' },
  { label: 'Visitors', href: '/visitors', icon: UserPlus, category: 'Navigation' },
  { label: 'Prayer Requests', href: '/prayer-requests', icon: HandHeart, category: 'Navigation' },
  { label: 'Communications', href: '/communications', icon: MessageSquare, category: 'Navigation' },
  { label: 'AI Studio', href: '/ai-studio', icon: Sparkles, category: 'Navigation' },
  { label: 'Sermons', href: '/sermons', icon: BookOpen, category: 'Navigation' },
  { label: 'Events', href: '/events', icon: Calendar, category: 'Navigation' },
  { label: 'Settings — Church Profile', href: '/settings?tab=profile', icon: Settings, category: 'Settings' },
  { label: 'Settings — Branding', href: '/settings?tab=branding', icon: Settings, category: 'Settings' },
  { label: 'Settings — Social Media', href: '/settings?tab=social', icon: Settings, category: 'Settings' },
  { label: 'Settings — Giving & Payment', href: '/settings?tab=giving', icon: Settings, category: 'Settings' },
  { label: 'Settings — Users & Roles', href: '/settings?tab=users', icon: Settings, category: 'Settings' },
  { label: 'Reports', href: '/reports', icon: BarChart3, category: 'Navigation' },
]

interface SearchResult {
  id: string
  label: string
  sub?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  category: string
}

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { church } = useChurchStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearchQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  const filteredNav = searchQuery.trim()
    ? NAV_SHORTCUTS.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : NAV_SHORTCUTS.slice(0, 6)

  const performSearch = useCallback(async (q: string) => {
    if (!church?.id || !q.trim()) return
    setSearching(true)
    const found: SearchResult[] = []
    try {
      // Search people
      const peopleSnap = await getDocs(query(collection(db, 'churches', church.id, 'people'), orderBy('fullName'), limit(20))).catch(() => null)
      if (peopleSnap) {
        peopleSnap.docs.forEach(d => {
          const data = d.data()
          if (
            data.fullName?.toLowerCase().includes(q.toLowerCase()) ||
            data.email?.toLowerCase().includes(q.toLowerCase()) ||
            data.phone?.includes(q)
          ) {
            found.push({
              id: d.id,
              label: data.fullName ?? 'Person',
              sub: data.email || data.phone || '',
              href: '/members',
              icon: Users,
              category: 'Members',
            })
          }
        })
      }

      // Search visitors
      const visitorsSnap = await getDocs(query(collection(db, 'churches', church.id, 'visitors'), orderBy('fullName'), limit(10))).catch(() => null)
      if (visitorsSnap) {
        visitorsSnap.docs.forEach(d => {
          const data = d.data()
          if (
            data.fullName?.toLowerCase().includes(q.toLowerCase()) ||
            data.email?.toLowerCase().includes(q.toLowerCase())
          ) {
            found.push({
              id: d.id,
              label: data.fullName ?? 'Visitor',
              sub: data.email || '',
              href: '/visitors',
              icon: UserPlus,
              category: 'Visitors',
            })
          }
        })
      }

      // Search prayer requests
      const prayerSnap = await getDocs(query(collection(db, 'churches', church.id, 'prayerRequests'), orderBy('createdAt', 'desc'), limit(10))).catch(() => null)
      if (prayerSnap) {
        prayerSnap.docs.forEach(d => {
          const data = d.data()
          if (data.request?.toLowerCase().includes(q.toLowerCase()) || data.personName?.toLowerCase().includes(q.toLowerCase())) {
            found.push({
              id: d.id,
              label: data.personName ?? 'Prayer Request',
              sub: data.request?.slice(0, 60) ?? '',
              href: '/prayer-requests',
              icon: HandHeart,
              category: 'Prayer Requests',
            })
          }
        })
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
    setResults(found.slice(0, 8))
  }, [church?.id])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(() => performSearch(searchQuery), 250)
    return () => clearTimeout(t)
  }, [searchQuery, performSearch])

  const allResults: SearchResult[] = [
    ...filteredNav.map(n => ({ ...n, id: n.href })),
    ...results,
  ]

  const handleSelect = (item: SearchResult) => {
    router.push(item.href)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allResults[selectedIndex]) handleSelect(allResults[selectedIndex])
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        {/* Left — Search trigger */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            onClick={() => setIsOpen(true)}
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

      {/* Command Search Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search members, visitors, pages..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searching && <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />}
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto py-2">
              {allResults.length === 0 && searchQuery.trim() && !searching && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}

              {allResults.length > 0 && (
                <div className="space-y-0.5 px-2">
                  {allResults.map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-left transition-colors ${
                          idx === selectedIndex ? 'bg-brand-500/10 text-brand-500' : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          idx === selectedIndex ? 'bg-brand-500/20' : 'bg-muted'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.label}</p>
                          {item.sub && <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{item.category}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {!searchQuery.trim() && (
                <p className="px-4 py-2 text-[10px] text-muted-foreground">
                  Type to search members, visitors, prayer requests, and more...
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t px-4 py-2.5 text-[10px] text-muted-foreground">
              <span><kbd className="rounded border px-1">↑↓</kbd> Navigate</span>
              <span><kbd className="rounded border px-1">↵</kbd> Select</span>
              <span><kbd className="rounded border px-1">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
