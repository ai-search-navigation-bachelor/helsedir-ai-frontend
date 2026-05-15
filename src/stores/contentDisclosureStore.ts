import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Tracks which disclosure/accordion items are open for each content page.
 * Keyed by page path so expanded state is restored when navigating back.
 * Persisted to sessionStorage and cleared when the browser tab is closed.
 */
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [pageKey]: removed, ...rest } = state.openDisclosureIdsByPage
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
