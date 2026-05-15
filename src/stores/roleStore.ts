import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface RoleState {
  role: string | null
  setRole: (role: string | null) => void
}

/**
 * Global store for the active user role (e.g. "lege", "sykepleier").
 * Persisted to localStorage so the selection survives page reloads.
 * The role is forwarded to search requests to personalise result ranking.
 */
export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role: string | null) => set({ role }),
    }),
    {
      name: 'role-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
