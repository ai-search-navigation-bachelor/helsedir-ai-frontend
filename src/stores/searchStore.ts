import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface SearchFilters {
  tema?: string[]
  innholdstype?: string
}

interface SearchState {
  searchId: string | null
  searchQuery: string | null
  filters: SearchFilters
  setSearchId: (searchId: string | null) => void
  setSearchQuery: (query: string) => void
  setSearchData: (searchId: string, query: string) => void
  setFilters: (filters: SearchFilters) => void
  clearFilters: () => void
  clearSearch: () => void
}

/**
 * Global search state store using Zustand
 * Persists search_id, query, and filters across page navigation
 */
export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      searchId: null,
      searchQuery: null,
      filters: {},

      setSearchId: (searchId: string | null) => set({ searchId }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setSearchData: (searchId: string, query: string) =>
        set({ searchId, searchQuery: query }),

      setFilters: (filters: SearchFilters) => set({ filters }),

      clearFilters: () => set({ filters: {} }),

      clearSearch: () => set({ searchId: null, searchQuery: null, filters: {} }),
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
