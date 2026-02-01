/**
 * Content Types
 * Types for content details and nested structures
 */

/**
 * Content link
 */
export interface ContentLink {
  rel: string
  type: string
  tittel: string
  href: string
  strukturId?: string
}

/**
 * Content detail
 */
export interface ContentDetail {
  id: string
  title: string
  body: string
  content_type: string
  target_groups?: string[]
  links?: ContentLink[]
}

/**
 * Nested content link (from Helsedirektoratet API)
 */
export interface NestedContentLink {
  rel: string
  type?: string
  tittel?: string
  href?: string
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
  lenker?: NestedContentLink[]
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
