/**
 * TanStack Query infinite-scroll hook for paginated search results.
 * Each page fetches {@link PAGE_SIZE} results at the next offset.
 * Carries the searchId from the first page forward so the backend can maintain
 * session context across paginated requests.
 */
import { useInfiniteQuery, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { search } from '../../api'
import type { SearchOptions } from '../../api'
import type { SearchResponse } from '../../types'

export const PAGE_SIZE = 15

interface SearchPageParam {
  offset: number
  searchId?: string
}

export interface UseSearchInfiniteQueryOptions {
  enabled?: boolean
  role?: string
  category?: string
  search_id?: string
  method?: SearchOptions['method']
  rerank?: boolean
  explain?: boolean
  bm25_weight?: number
  semantic_weight?: number
  rrf_k?: number
  temaside_boost?: number
  retningslinje_boost?: number
  role_boost?: number
  role_penalty?: number
}

export function buildSearchInfiniteQueryKey(
  query: string,
  options?: UseSearchInfiniteQueryOptions,
) {
  return [
    'search',
    query,
    options?.category,
    options?.role,
    options?.search_id,
    options?.method,
    options?.rerank,
    options?.explain,
    options?.bm25_weight,
    options?.semantic_weight,
    options?.rrf_k,
    options?.temaside_boost,
    options?.retningslinje_boost,
    options?.role_boost,
    options?.role_penalty,
  ] as const
}

export function useSearchInfiniteQuery(
  query: string,
  options?: UseSearchInfiniteQueryOptions,
) {
  return useInfiniteQuery<
    SearchResponse,
    Error,
    InfiniteData<SearchResponse>,
    readonly unknown[],
    SearchPageParam
  >({
    queryKey: buildSearchInfiniteQueryKey(query, options),
    queryFn: async ({ signal, pageParam }) => {
      return search(query, {
        signal,
        offset: pageParam.offset,
        limit: PAGE_SIZE,
        role: options?.role,
        category: options?.category,
        search_id: pageParam.searchId || options?.search_id,
        method: options?.method,
        rerank: options?.rerank,
        explain: options?.explain,
        bm25_weight: options?.bm25_weight,
        semantic_weight: options?.semantic_weight,
        rrf_k: options?.rrf_k,
        temaside_boost: options?.temaside_boost,
        retningslinje_boost: options?.retningslinje_boost,
        role_boost: options?.role_boost,
        role_penalty: options?.role_penalty,
      })
    },
    initialPageParam: { offset: 0, searchId: options?.search_id },
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
  return queryClient.prefetchInfiniteQuery<
    SearchResponse,
    Error,
    InfiniteData<SearchResponse>,
    readonly unknown[],
    SearchPageParam
  >({
    queryKey: buildSearchInfiniteQueryKey(query, { category, role, search_id: searchId }),
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
    initialPageParam: { offset: 0, searchId },
  })
}
