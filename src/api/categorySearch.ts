/**
 * Category Search API
 * Handles search within a specific category
 */

import { API_ENDPOINTS } from './config'
import { httpRequest, buildUrl } from './httpClient'
import type { SearchResultBase, PaginatedResponse, BaseRequestOptions } from './types'

/**
 * Category search result item
 */
export interface CategorySearchResult extends SearchResultBase {}

/**
 * Category search response
 */
export interface CategorySearchResponse extends PaginatedResponse {
  results: CategorySearchResult[]
  category: string
}

/**
 * Category search options
 */
export interface CategorySearchOptions extends BaseRequestOptions {
  search_id: string
}

/**
 * Search within a specific category
 */
export async function searchCategoryApi(
  query: string,
  category: string,
  { signal, role, search_id }: CategorySearchOptions,
): Promise<CategorySearchResponse> {
  const trimmed = query.trim()
  
  if (!trimmed || !category || !search_id) {
    throw new Error('Query, category, and search_id are required')
  }

  const url = buildUrl(API_ENDPOINTS.categorySearch, {
    query: trimmed,
    category,
    search_id,
    role,
  })

  return httpRequest<CategorySearchResponse>(url, { signal })
}
