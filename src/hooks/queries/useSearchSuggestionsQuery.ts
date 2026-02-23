import { useQuery } from '@tanstack/react-query'
import { fetchSearchSuggestions } from '../../api'
import type { SearchSuggestionsResponse } from '../../types'
import { useDebouncedValue } from '../useDebouncedValue'

const DEBOUNCE_MS = 500

export function useSearchSuggestionsQuery(query: string, enabled = true) {
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)

  return useQuery<SearchSuggestionsResponse, Error>({
    queryKey: ['searchSuggestions', debouncedQuery],
    queryFn: async ({ signal }) => {
      return fetchSearchSuggestions(debouncedQuery, { signal })
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
