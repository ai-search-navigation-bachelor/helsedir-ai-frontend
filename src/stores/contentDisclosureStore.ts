import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ContentDisclosureState {
  openDisclosureIdsByPage: Record<string, string[]>
  setDisclosureOpen: (pageKey: string, disclosureId: string, open: boolean) => void
}

export const useContentDisclosureStore = create<ContentDisclosureState>()(
  persist(
    (set) => ({
      openDisclosureIdsByPage: {},
      setDisclosureOpen: (pageKey, disclosureId, open) =>
        set((state) => {
          const currentIds = state.openDisclosureIdsByPage[pageKey] ?? []
          const nextIds = open
            ? (currentIds.includes(disclosureId) ? currentIds : [...currentIds, disclosureId])
            : currentIds.filter((id) => id !== disclosureId)

          if (nextIds === currentIds) {
            return state
          }

          if (nextIds.length === 0) {
            if (!(pageKey in state.openDisclosureIdsByPage)) {
              return state
            }

            const { [pageKey]: removedPageEntry, ...rest } = state.openDisclosureIdsByPage
            void removedPageEntry
            return { openDisclosureIdsByPage: rest }
          }

          return {
            openDisclosureIdsByPage: {
              ...state.openDisclosureIdsByPage,
              [pageKey]: nextIds,
            },
          }
        }),
    }),
    {
      name: 'content-disclosure-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
