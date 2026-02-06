import { useQuery } from '@tanstack/react-query'
import { searchCategory } from '../../api'
import type { CategorySearchResponse } from '../../types'

type UseCategorySearchQueryOptions = {
  role?: string
  search_id: string
  enabled?: boolean
}

export function useCategorySearchQuery(
  query: string,
  category: string,
  { role, search_id, enabled = true }: UseCategorySearchQueryOptions,
) {
  return useQuery<CategorySearchResponse>({
    queryKey: ['categorySearch', query, category, role, search_id],
    queryFn: ({ signal }) => searchCategory(query, category, { signal, role, search_id }),
    enabled: enabled && !!query && !!category && !!search_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  })
}
