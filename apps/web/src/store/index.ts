'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from 'firebase/auth'
import type { Church, UserRole, AIMode } from '@church-growth-os/shared'

// ============================================================
// AUTH STORE
// ============================================================

interface AuthState {
  user: User | null
  churchId: string | null
  role: UserRole | null
  isSuperAdmin: boolean
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: User | null) => void
  setClaims: (claims: { churchId: string; role: UserRole; superAdmin?: boolean }) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  churchId: null,
  role: null,
  isSuperAdmin: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setClaims: (claims) =>
    set({
      churchId: claims.churchId,
      role: claims.role,
      isSuperAdmin: claims.superAdmin ?? false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () =>
    set({
      user: null,
      churchId: null,
      role: null,
      isSuperAdmin: false,
    }),
}))

// ============================================================
// CHURCH / TENANT STORE
// ============================================================

interface ChurchState {
  church: Church | null
  isLoading: boolean

  setChurch: (church: Church | null) => void
  setLoading: (loading: boolean) => void
  updateBranding: (branding: Partial<Church['branding']>) => void
  updateSettings: (settings: Partial<Church['settings']>) => void
}

export const useChurchStore = create<ChurchState>()(
  persist(
    (set, get) => ({
      church: null,
      isLoading: false,

      setChurch: (church) => set({ church }),
      setLoading: (isLoading) => set({ isLoading }),
      updateBranding: (branding) => {
        const church = get().church
        if (!church) return
        set({ church: { ...church, branding: { ...church.branding, ...branding } } })
      },
      updateSettings: (settings) => {
        const church = get().church
        if (!church) return
        set({ church: { ...church, settings: { ...church.settings, ...settings } } })
      },
    }),
    {
      name: 'church-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ church: state.church }),
    }
  )
)

// ============================================================
// UI STORE
// ============================================================

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  activeModal: string | null

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      activeModal: null,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setActiveModal: (activeModal) => set({ activeModal }),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// ============================================================
// AI STORE
// ============================================================

interface AIState {
  mode: AIMode
  isGenerating: boolean
  lastDailyMission: string | null
  dailyMissionCompleted: boolean

  setMode: (mode: AIMode) => void
  setGenerating: (generating: boolean) => void
  setLastDailyMission: (date: string) => void
  setDailyMissionCompleted: (completed: boolean) => void
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      mode: 'autonomous',
      isGenerating: false,
      lastDailyMission: null,
      dailyMissionCompleted: false,

      setMode: (mode) => set({ mode }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setLastDailyMission: (date) => set({ lastDailyMission: date }),
      setDailyMissionCompleted: (completed) => set({ dailyMissionCompleted: completed }),
    }),
    {
      name: 'ai-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
