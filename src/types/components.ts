/**
 * Component-level type definitions
 */

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

/**
 * Search form props
 */
export interface SearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onClear?: () => void
}

/**
 * Result item props for search results
 */
export interface ResultItemProps {
  result: {
    id: string
    title: string
    info_type: string
    score: number
    explanation?: string
  }
}

/**
 * Table of contents props
 */
export interface TableOfContentsProps {
  chapters: Array<{
    id: string
    tittel?: string
    title?: string
    tekst?: string
    body?: string
    intro?: string
    children?: Array<{
      id: string
      tittel?: string
      title?: string
      tekst?: string
      body?: string
      intro?: string
    }>
  }>
  expandedChapters: Set<number>
  activeChapter: string | null
  onChapterClick: (index: number) => void
  isLoading?: boolean
}
