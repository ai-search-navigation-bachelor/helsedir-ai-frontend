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

/**
 * Info type metadata from the backend
 */
export interface InfoType {
  slug: string
  display_name: string
  searchable: boolean
}

/**
 * A document tagged with one or more roles
 */
export interface RoleTagDocument {
  id: string
  title: string
  info_type: string
  path: string | null
}

/**
 * A role group containing tagged documents
 */
export interface RoleTagGroup {
  slug: string
  display_name: string
  document_count: number
  documents: RoleTagDocument[]
}
