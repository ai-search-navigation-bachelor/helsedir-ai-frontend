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
  href: string | null
  id?: string | null
  path?: string | null
  strukturId?: string
  children?: ContentLink[] | null
}

/**
 * Linked content item within a temaside group
 */
export interface LinkedContentItem {
  id: string
  title: string
  info_type: string
  path?: string
}

/**
 * Grouped linked content on a temaside
 */
export interface LinkedContentGroup {
  info_type: string
  display_name: string
  items: LinkedContentItem[]
}

/**
 * Content detail
 */
export interface ContentDetail {
  id: string
  title: string
  body: string
  content_type: string
  path?: string
  target_groups?: string[]
  links?: ContentLink[]
  linked_content?: LinkedContentGroup[]
  status?: string
  forstPublisert?: string
  sistOppdatert?: string
  sistFagligOppdatert?: string
  url?: string
  anbefaling_fields?: {
    praktisk?: string
    rasjonale?: string
    fordeler_ulemper?: string
    verdier_preferanser?: string
    // Backend can return additional recommendation fields not yet shown in UI.
    kvalitet_dokumentasjon?: string
    ressurshensyn?: string
    styrke?: string
  }
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
  path?: string
  type?: string
  tittel?: string
  kortTittel?: string
  title?: string
  tekst?: string
  body?: string
  intro?: string
  kortIntro?: string
  status?: string
  forstPublisert?: string
  sistOppdatert?: string
  sistFagligOppdatert?: string
  url?: string
  data?: {
    styrke?: string
    praktisk?: string
    rasjonale?: string
    fil?: string
    nokkelInfo?: {
      fordelerogulemper?: string
      verdierogpreferanser?: string
    }
    // API-et kan inneholde flere felter i `data` som varierer mellom innholdstyper.
    [key: string]: unknown
  }
  attachments?: Array<{
    href?: string
    url?: string
    fil?: string
    tittel?: string
    title?: string
    type?: string
    contentType?: string
  }> | null
  tekniskeData?: {
    infoType?: string
    subtype?: string
  }
  lenker?: NestedContentLink[]
  links?: NestedContentLink[]
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
