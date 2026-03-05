import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface RoleState {
  role: string | null
  setRole: (role: string | null) => void
}

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
