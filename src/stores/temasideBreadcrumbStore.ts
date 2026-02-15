import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { BreadcrumbItem } from '../types/components'

interface TemasideBreadcrumbState {
  trailByPath: Record<string, BreadcrumbItem[]>
  lastPath: string | null
  setTrail: (path: string, items: BreadcrumbItem[]) => void
  clearTrail: (path: string) => void
  clearAllTrails: () => void
}

export const useTemasideBreadcrumbStore = create<TemasideBreadcrumbState>()(
  persist(
    (set) => ({
      trailByPath: {},
      lastPath: null,

      setTrail: (path: string, items: BreadcrumbItem[]) =>
        set((state) => ({
          trailByPath: {
            ...state.trailByPath,
            [path]: items,
          },
          lastPath: path,
        })),

      clearTrail: (path: string) =>
        set((state) => {
          const next = { ...state.trailByPath }
          delete next[path]
          return {
            trailByPath: next,
            lastPath: state.lastPath === path ? null : state.lastPath,
          }
        }),

      clearAllTrails: () => set({ trailByPath: {}, lastPath: null }),
    }),
    {
      name: 'temaside-breadcrumb-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
