import { useQuery } from '@tanstack/react-query'
import { searchCategorized } from '../../api'
import type { CategorizedSearchResponse } from '../../types'

export type UseCategorizedSearchQueryOptions = {
  enabled?: boolean
  role?: string
  tema?: string[]
  innholdstype?: string
}

export function useCategorizedSearchQuery(
  query: string,
  options?: UseCategorizedSearchQueryOptions,
) {
  return useQuery<CategorizedSearchResponse, Error>({
    queryKey: ['categorized-search', query, options?.role, options?.tema, options?.innholdstype],
    queryFn: async ({ signal }) => {
      return searchCategorized(query, {
        signal,
        role: options?.role,
        tema: options?.tema,
        innholdstype: options?.innholdstype,
      })
    },
    enabled: options?.enabled !== false && query.trim().length > 0,
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
