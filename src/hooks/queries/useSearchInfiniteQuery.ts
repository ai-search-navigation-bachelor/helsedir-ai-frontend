import { useInfiniteQuery, type QueryClient } from '@tanstack/react-query'
import { search } from '../../api'
import type { SearchResponse } from '../../types'

export const PAGE_SIZE = 15

export interface UseSearchInfiniteQueryOptions {
  enabled?: boolean
  role?: string
  category?: string
  search_id?: string
}

export function useSearchInfiniteQuery(
  query: string,
  options?: UseSearchInfiniteQueryOptions,
) {
  return useInfiniteQuery<SearchResponse, Error>({
    queryKey: [
      'search',
      query,
      options?.category,
      options?.role,
    ],
    queryFn: async ({ signal, pageParam }) => {
      const { offset, searchId } = pageParam as { offset: number; searchId?: string }

      return search(query, {
        signal,
        offset,
        limit: PAGE_SIZE,
        role: options?.role,
        category: options?.category,
        search_id: searchId || options?.search_id,
      })
    },
    initialPageParam: { offset: 0, searchId: options?.search_id } as {
      offset: number
      searchId?: string
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_next) return undefined

      return {
        offset: lastPage.offset + lastPage.limit,
        searchId: lastPage.search_id,
      }
    },
    enabled: options?.enabled !== false && query.trim().length > 0,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Prefetch the first page of a category search into the query cache.
 */
export function prefetchCategorySearch(
  queryClient: QueryClient,
  query: string,
  category: string,
  searchId: string,
  role?: string,
) {
  return queryClient.prefetchInfiniteQuery<SearchResponse>({
    queryKey: ['search', query, category, role],
    queryFn: async ({ signal }) => {
      return search(query, {
        signal,
        offset: 0,
        limit: PAGE_SIZE,
        category,
        search_id: searchId,
        role,
        log: false,
      })
    },
    initialPageParam: { offset: 0, searchId } as {
      offset: number
      searchId?: string
    },
  })
}
