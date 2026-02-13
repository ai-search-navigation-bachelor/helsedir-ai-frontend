/**
 * Page-level type definitions
 */
import type { ContentDetail } from './content'

/**
 * Content display props
 */
export interface ContentDisplayProps {
  content: ContentDetail
}

/**
 * Chapter state management
 */
export interface ChapterState {
  expandedChapters: Set<number>
  expandedSubchapters: Set<string>
  activeChapter: string | null
}
