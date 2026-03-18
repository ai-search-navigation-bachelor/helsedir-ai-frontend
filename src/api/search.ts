/**
 * Search API
 * Handles search operations: general search with pagination and suggestions
 */

import { ApiError, httpRequest, buildUrl } from '../lib/httpClient'
import type {
  BaseRequestOptions,
  SearchResponse,
  SearchSuggestionsResponse,
} from '../types'

import { BACKEND_BASE_URL } from './backendBaseUrl'

/**
 * General search options
 */
export interface SearchOptions extends BaseRequestOptions {
  offset?: number
  limit?: number
  search_id?: string
  category?: string
  log?: boolean
  method?: 'hybrid' | 'keyword' | 'semantic'
  rerank?: boolean
  explain?: boolean
  bm25_weight?: number
  semantic_weight?: number
  rrf_k?: number
  temaside_boost?: number
  retningslinje_boost?: number
  role_boost?: number
  role_penalty?: number
  noCache?: boolean
}

/**
 * Empty search response for invalid queries
 */
function emptySearchResponse(): SearchResponse {
  return {
    results: [],
    query: '',
    total: 0,
    offset: 0,
    limit: 15,
    search_id: '',
    has_next: false,
    has_prev: false,
    category_counts: {},
  }
}

/**
 * General search - returns paginated results with category counts
 */
export async function search(
  query: string,
  {
    signal,
    offset = 0,
    limit = 15,
    role,
    search_id,
    category,
    log,
    method,
    rerank,
    explain,
    bm25_weight,
    semantic_weight,
    rrf_k,
    temaside_boost,
    retningslinje_boost,
    role_boost,
    role_penalty,
    noCache,
  }: SearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return emptySearchResponse()
  }

  const params = {
    query: trimmed,
    offset,
    limit,
    role,
    search_id,
    category,
    log,
    method,
    rerank,
    explain,
    bm25_weight,
    semantic_weight,
    rrf_k,
    temaside_boost,
    retningslinje_boost,
    role_boost,
    role_penalty,
  } satisfies Record<string, string | number | boolean | undefined>

  const url = buildUrl(`${BACKEND_BASE_URL}/search`, params)

  const fetchOptions = { signal, ...(noCache && { cache: 'no-store' as RequestCache }) }

  try {
    return await httpRequest<SearchResponse>(url, fetchOptions)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400 || !search_id) {
      throw error
    }

    const retryUrl = buildUrl(`${BACKEND_BASE_URL}/search`, {
      ...params,
      search_id: undefined,
    })

    return httpRequest<SearchResponse>(retryUrl, fetchOptions)
  }
}

/**
 * Keyword search - title-based matching, no semantic component
 * Uses the unified /search endpoint with method=keyword
 */
export async function searchKeyword(
  query: string,
  { signal, limit = 20, role, noCache }: BaseRequestOptions & { limit?: number; noCache?: boolean } = {},
): Promise<SearchResponse> {
  return search(query, { signal, limit, role, method: 'keyword', noCache })
}

/**
 * Search suggestions - returns autocomplete suggestions for theme pages
 */
export async function fetchSearchSuggestions(
  query: string,
  { signal, role }: BaseRequestOptions = {},
): Promise<SearchSuggestionsResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return { suggestions: [] }
  }

  const url = buildUrl(`${BACKEND_BASE_URL}/search/suggestions`, {
    query: trimmed,
    role,
  })

  return httpRequest<SearchSuggestionsResponse>(url, { signal })
}
