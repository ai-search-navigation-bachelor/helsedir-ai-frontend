import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { fetchSearchSuggestions } from '../../api'
import type { SearchSuggestionsResponse } from '../../types'

const DEBOUNCE_MS = 500

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

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
