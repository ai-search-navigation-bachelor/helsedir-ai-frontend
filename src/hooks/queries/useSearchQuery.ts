import { useQuery } from '@tanstack/react-query'
import { searchApi, type SearchApiResult } from '../../api/search'

export type UseSearchQueryOptions = {
  enabled?: boolean
}

export function useSearchQuery(
  query: string,
  options?: UseSearchQueryOptions,
) {
  return useQuery<SearchApiResult, Error>({
    queryKey: ['search', query],
    queryFn: async ({ signal }) => {
      return searchApi(query, { signal })
    },
    enabled: options?.enabled !== false && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
