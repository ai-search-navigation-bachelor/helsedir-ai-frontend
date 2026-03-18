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
  title: string
  href: string | null
  id?: string | null
  path?: string | null
  strukturId?: string
  last_reviewed_date?: string | null
  children?: ContentLink[] | null
}

export interface ContentRelationItem {
  id: string
  title: string
  short_title?: string | null
  display_title?: string | null
  content_type?: string
  info_type?: string
  relation_kind?: string
  relation?: string
  kind?: string
  path?: string | null
  has_text_content?: boolean
  document_url?: string | null
  is_pdf_only?: boolean
  children?: NestedContent[] | null
}

export interface ContentChildGroup {
  info_type: string
  display_name: string
  items: ContentRelationItem[]
}

/**
 * Linked content item within a temaside group
 */
export interface LinkedContentItem {
  id: string
  title: string
  short_title?: string | null
  display_title?: string | null
  info_type: string
  path?: string
  has_text_content?: boolean
  document_url?: string | null
  is_pdf_only?: boolean
}

/**
 * Grouped linked content on a temaside
 */
export interface LinkedContentGroup {
  info_type: string
  display_name: string
  items: LinkedContentItem[]
}

export interface RelatedContentLink {
  title: string
  url: string
  is_document?: boolean
  file_type?: string | null
  url_type?: string | null
  target?: string | null
  path?: string | null
  content_id?: string | null
}

export interface EhelsestandardAttachment {
  title: string
  url: string
  file_type?: string | null
}

export interface EhelsestandardFields {
  standard_id?: string
  standard_type?: string
  purpose_html?: string
  applies_to_html?: string
  attachments?: EhelsestandardAttachment[] | null
}

/**
 * Content detail
 */
export interface ContentDetail {
  id: string
  title: string
  short_title?: string | null
  display_title?: string | null
  body: string
  content_type: string
  path?: string
  has_text_content?: boolean
  document_url?: string | null
  is_pdf_only?: boolean
  related_links?: RelatedContentLink[] | null
  role_tags?: string[]
  links?: ContentLink[]
  parent?: ContentRelationItem | null
  root_publication?: ContentRelationItem | null
  chapters?: NestedContent[]
  references?: ContentRelationItem[]
  related_content?: ContentRelationItem[]
  child_groups?: ContentChildGroup[]
  linked_content?: LinkedContentGroup[] | null
  status?: string
  first_published?: string
  last_reviewed_date?: string
  url?: string
  ehelsestandard_fields?: EhelsestandardFields | null
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
  title?: string
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
  short_title?: string | null
  display_title?: string | null
  tekst?: string
  body?: string
  intro?: string
  kortIntro?: string
  has_text_content?: boolean
  document_url?: string | null
  is_pdf_only?: boolean
  related_links?: RelatedContentLink[] | null
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
