import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchState {
  searchId: string | null
  searchQuery: string | null
  setSearchId: (searchId: string) => void
  setSearchQuery: (query: string) => void
  setSearchData: (searchId: string, query: string) => void
  clearSearch: () => void
}

/**
 * Global search state store using Zustand
 * Persists search_id and query across page navigation
 */
export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      searchId: null,
      searchQuery: null,

      setSearchId: (searchId: string) => set({ searchId }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setSearchData: (searchId: string, query: string) =>
        set({ searchId, searchQuery: query }),

      clearSearch: () => set({ searchId: null, searchQuery: null }),
    }),
    {
      name: 'search-storage', // localStorage key
    }
  )
)
