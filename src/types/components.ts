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
  metaLabel?: string
  /** Semantic group for visual separation: home, tema, parent, current */
  group?: 'home' | 'tema' | 'parent' | 'current'
}

/**
 * Search form props
 */
export interface SearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onClear?: () => void
  onSuggestionSelect?: (id: string) => void
}

