/**
 * Page-level type definitions
 */

/**
 * Content display props
 */
export interface ContentDisplayProps {
  content: {
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
}

/**
 * Chapter state management
 */
export interface ChapterState {
  expandedChapters: Set<number>
  expandedSubchapters: Set<string>
  activeChapter: string | null
}
