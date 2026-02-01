import { useQuery } from '@tanstack/react-query'
import { searchCategorizedApi, type CategorizedSearchResponse } from '../../api/categorized'

export type UseCategorizedSearchQueryOptions = {
  enabled?: boolean
  role?: string
  tema?: string
  innholdstype?: string
}

export function useCategorizedSearchQuery(
  query: string,
  options?: UseCategorizedSearchQueryOptions,
) {
  return useQuery<CategorizedSearchResponse, Error>({
    queryKey: ['categorized-search', query, options?.role, options?.tema, options?.innholdstype],
    queryFn: async ({ signal }) => {
      return searchCategorizedApi(query, {
        signal,
        role: options?.role,
        tema: options?.tema,
        innholdstype: options?.innholdstype,
      })
    },
    enabled: options?.enabled !== false && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
