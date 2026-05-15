/** Type definitions for hierarchical content tree nodes used by the chapter sidebar, page content, and tree utilities. */
import type { ContentLink, NestedContent } from '../../../types'

export interface ChapterEntry {
  index: number
  link: ContentLink
  chapter?: NestedContent
  fetchError?: string
}

export interface PageNode {
  id: string
  title: string
  numbering: string
  depth: number
  parentId: string | null
  childrenIds: string[]
  expandableChildren: NestedContent[]
  node: NestedContent
  isPlaceholder?: boolean
  placeholderStatus?: 'loading' | 'error'
  placeholderError?: string
}

export interface TreeResult {
  rootIds: string[]
  pagesById: Map<string, PageNode>
}
