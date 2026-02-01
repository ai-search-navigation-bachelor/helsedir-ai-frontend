/**
 * Search API
 * Handles all search operations: categorized, category-specific, and general search
 */

import { httpRequest, buildUrl } from '../lib/httpClient'
import type {
  BaseRequestOptions,
  CategorizedSearchResponse,
  CategorySearchResponse,
  SearchResponse,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://129.241.150.141:8000'

/**
 * Categorized search options
 */
export interface CategorizedSearchOptions extends BaseRequestOptions {
  tema?: string[]
  innholdstype?: string
}

/**
 * Category search options
 */
export interface CategorySearchOptions extends BaseRequestOptions {
  search_id: string
}

/**
 * General search options
 */
export interface SearchOptions extends BaseRequestOptions {
  depth?: number
  offset?: number
  limit?: number
  search_id?: string
}

/**
 * Empty categorized response for invalid queries
 */
function emptyCategorizedResponse(query: string): CategorizedSearchResponse {
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
 * Empty search response for invalid queries
 */
function emptySearchResponse(): SearchResponse {
  return {
    results: [],
    query: '',
    total: 0,
    offset: 0,
    limit: 10,
    search_id: '',
    has_next: false,
    has_prev: false,
  }
}

/**
 * Categorized search - returns results grouped by category
 */
export async function searchCategorized(
  query: string,
  { signal, role, tema, innholdstype }: CategorizedSearchOptions = {},
): Promise<CategorizedSearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return emptyCategorizedResponse(trimmed)
  }

  const url = buildUrl(`${BASE_URL}/search/categorized`, {
    query: trimmed,
    role,
    tema: tema && tema.length > 0 ? tema.join(',') : undefined,
    innholdstype,
  })

  return httpRequest<CategorizedSearchResponse>(url, { signal })
}

/**
 * Category-specific search - search within a single category
 */
export async function searchCategory(
  query: string,
  category: string,
  { signal, role, search_id }: CategorySearchOptions,
): Promise<CategorySearchResponse> {
  const trimmed = query.trim()

  if (!trimmed || !category || !search_id) {
    throw new Error('Query, category, and search_id are required')
  }

  const url = buildUrl(`${BASE_URL}/search/category`, {
    query: trimmed,
    category,
    search_id,
    role,
  })

  return httpRequest<CategorySearchResponse>(url, { signal })
}

/**
 * General search - returns paginated results
 */
export async function search(
  query: string,
  { signal, offset = 0, limit = 10, role, search_id }: SearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return emptySearchResponse()
  }

  const url = buildUrl(`${BASE_URL}/search`, {
    query: trimmed,
    offset,
    limit,
    role,
    search_id,
  })

  return httpRequest<SearchResponse>(url, { signal })
}
