/**
 * API Types
 * Common types for API requests and responses
 */

/**
 * Common request options
 */
export interface BaseRequestOptions {
  signal?: AbortSignal
  role?: string
}

/**
 * Paginated response base
 */
export interface PaginatedResponse {
  query: string
  total: number
  offset: number
  limit: number
  search_id: string
  has_next: boolean
  has_prev: boolean
}
