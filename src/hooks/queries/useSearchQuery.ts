import { useQuery } from '@tanstack/react-query'
import { search } from '../../api'
import type { SearchResponse } from '../../types'

export type UseSearchQueryOptions = {
  enabled?: boolean
}

export function useSearchQuery(
  query: string,
  options?: UseSearchQueryOptions,
) {
  return useQuery<SearchResponse, Error>({
    queryKey: ['search', query],
    queryFn: async ({ signal }) => {
      return search(query, { signal })
    },
    enabled: options?.enabled !== false && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
