/**
 * Shared API Types
 * Common type definitions used across all API modules
 */

/**
 * Base search result item
 */
export interface SearchResultBase {
  id: string
  title: string
  info_type: string
  score: number
  explanation?: string
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
 * Common request options
 */
export interface BaseRequestOptions {
  signal?: AbortSignal
  role?: string
}

/**
 * Content detail type
 */
export interface ContentDetail {
  id: string
  title: string
  body: string
  content_type: string
  target_groups?: string[]
  links?: Array<{
    rel: string
    type: string
    tittel: string
    href: string
    strukturId?: string
  }>
}

/**
 * Nested content from Helsedirektoratet API (external)
 */
export interface NestedContent {
  id: string
  tittel?: string
  title?: string
  tekst?: string
  body?: string
  intro?: string
  lenker?: Array<{
    rel: string
    type?: string
    tittel?: string
    href?: string
  }>
  children?: NestedContent[]
}

/**
 * Legacy info result item (for backwards compatibility)
 */
export interface InfoResultItem {
  id: string
  tittel: string
  tekst?: string | null
  intro?: string
  infoId?: string
  infoType?: string
  url: string
  forstPublisert?: string
  sistFagligOppdatert?: string
  children?: InfoResultItem[]
}
