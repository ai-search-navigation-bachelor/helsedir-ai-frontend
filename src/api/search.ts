/**
 * Search API
 * Handles general search and content retrieval
 */

import { API_ENDPOINTS } from './config'
import { httpRequest, buildUrl } from './httpClient'
import type { SearchResultBase, PaginatedResponse, BaseRequestOptions, ContentDetail, InfoResultItem } from './types'

/**
 * Search result item
 */
export interface SearchResultItem extends SearchResultBase {}

/**
 * Search API result
 */
export interface SearchApiResult extends PaginatedResponse {
  results: SearchResultItem[]
}

/**
 * Search options
 */
export interface SearchApiOptions extends BaseRequestOptions {
  depth?: number
  offset?: number
  limit?: number
  search_id?: string
}

/**
 * Empty search response for invalid queries
 */
function emptySearchResponse(): SearchApiResult {
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
 * General search
 */
export async function searchApi(
  query: string,
  { signal, offset = 0, limit = 10, role, search_id }: SearchApiOptions = {},
): Promise<SearchApiResult> {
  const trimmed = query.trim()
  
  if (!trimmed) {
    return emptySearchResponse()
  }

  const url = buildUrl(API_ENDPOINTS.search, {
    query: trimmed,
    offset,
    limit,
    role,
    search_id,
  })

  return httpRequest<SearchApiResult>(url, { signal })
}

/**
 * Get content by ID
 */
export async function getContentApi(
  contentId: string,
  searchId?: string,
  { signal }: SearchApiOptions = {},
): Promise<ContentDetail> {
  const trimmed = contentId.trim()
  
  if (!trimmed) {
    throw new Error('Content ID is required')
  }

  const url = buildUrl(`${API_ENDPOINTS.content}/${encodeURIComponent(trimmed)}`, {
    search_id: searchId,
  })

  return httpRequest<ContentDetail>(url, { signal })
}

/**
 * @deprecated Use getContentApi instead
 * Get infobit by ID (legacy endpoint)
 */
export async function getInfobitApi(
  infobitId: string,
  { signal, depth = 2 }: SearchApiOptions = {},
): Promise<InfoResultItem> {
  const trimmed = infobitId.trim()
  
  if (!trimmed) {
    throw new Error('Infobit ID is required')
  }

  // Legacy endpoint for backwards compatibility
  const legacyEndpoint = 'http://129.241.150.141:8000/helsedir/infobit'
  const url = buildUrl(`${legacyEndpoint}/${encodeURIComponent(trimmed)}`, {
    include_children: true,
    depth,
  })

  return httpRequest<InfoResultItem>(url, { signal })
}

// Re-export shared types for convenience
export type { ContentDetail, InfoResultItem } from './types'
