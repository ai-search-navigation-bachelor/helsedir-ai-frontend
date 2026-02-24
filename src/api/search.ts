/**
 * Search API
 * Handles search operations: general search with pagination and suggestions
 */

import { httpRequest, buildUrl } from '../lib/httpClient'
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
  { signal, offset = 0, limit = 15, role, search_id, category }: SearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return emptySearchResponse()
  }

  const url = buildUrl(`${BACKEND_BASE_URL}/search`, {
    query: trimmed,
    offset,
    limit,
    role,
    search_id,
    category,
  })

  return httpRequest<SearchResponse>(url, { signal })
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
