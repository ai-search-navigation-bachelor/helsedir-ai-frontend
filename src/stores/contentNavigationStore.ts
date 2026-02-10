import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ContentNavigationState {
  sectionByContentId: Record<string, string>
  setSectionForContent: (contentId: string, sectionId: string) => void
  clearSectionForContent: (contentId: string) => void
  clearAllSections: () => void
}

export const useContentNavigationStore = create<ContentNavigationState>()(
  persist(
    (set) => ({
      sectionByContentId: {},

      setSectionForContent: (contentId: string, sectionId: string) =>
        set((state) => ({
          sectionByContentId: {
            ...state.sectionByContentId,
            [contentId]: sectionId,
          },
        })),

      clearSectionForContent: (contentId: string) =>
        set((state) => {
          const next = { ...state.sectionByContentId }
          delete next[contentId]
          return { sectionByContentId: next }
        }),

      clearAllSections: () => set({ sectionByContentId: {} }),
    }),
    {
      name: 'content-navigation-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
