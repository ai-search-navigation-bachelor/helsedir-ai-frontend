/**
 * Categorized Search API
 * Handles categorized search requests with priority and other categories
 */

import { API_ENDPOINTS } from './config'
import { httpRequest, buildUrl } from './httpClient'
import type { SearchResultBase, BaseRequestOptions } from './types'

/**
 * Category result item
 */
export type CategoryResult = SearchResultBase

/**
 * Category group
 */
export interface CategoryGroup {
  category: string
  display_name: string
  count: number
  is_priority: boolean
  results: CategoryResult[]
}

/**
 * Categorized search response
 */
export interface CategorizedSearchResponse {
  query: string
  total: number
  min_score: number
  search_id: string
  priority_categories: CategoryGroup[]
  other_categories: CategoryGroup[]
}

/**
 * Categorized search options
 */
export interface CategorizedSearchOptions extends BaseRequestOptions {
  tema?: string
  innholdstype?: string
}

/**
 * Empty response for invalid queries
 */
function emptyResponse(query: string): CategorizedSearchResponse {
  return {
    query,
    total: 0,
    min_score: 0,
    search_id: '',
    priority_categories: [],
    other_categories: [],
  }
}

/**
 * Search with categorized results
 */
export async function searchCategorizedApi(
  query: string,
  { signal, role, tema, innholdstype }: CategorizedSearchOptions = {},
): Promise<CategorizedSearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return emptyResponse(trimmed)
  }

  const url = buildUrl(API_ENDPOINTS.categorizedSearch, {
    query: trimmed,
    role,
    tema,
    innholdstype,
  })

  return httpRequest<CategorizedSearchResponse>(url, { signal })
}
