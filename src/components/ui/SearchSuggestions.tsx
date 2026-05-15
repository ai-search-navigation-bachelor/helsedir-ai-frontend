/** Autocomplete suggestions dropdown rendered below the search input; shows debounced query suggestions from the API. */
import type { ReactNode } from 'react'
import { ds } from '../../styles/dsTokens'
import { SEARCH_SUBCATEGORY_LABELS } from '../../constants/categories'

export interface SearchSuggestionsProps {
  suggestions: Array<{ id: string; title: string; info_type?: string | null; path?: string | null }>
  query: string
  activeIndex: number
  listboxId: string
  onSelect: (id: string, path?: string | null) => void
  onActiveIndexChange: (index: number) => void
}

function highlightMatch(title: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return title

  const index = title.toLowerCase().indexOf(trimmed.toLowerCase())
  if (index === -1) return title

  const before = title.slice(0, index)
  const match = title.slice(index, index + trimmed.length)
  const after = title.slice(index + trimmed.length)

  return (
    <>
      {before}
      <strong style={{ fontWeight: 600, color: '#025169' }}>{match}</strong>
      {after}
    </>
  )
}

export function SearchSuggestions({
  suggestions,
  query,
  activeIndex,
  listboxId,
  onSelect,
  onActiveIndexChange,
}: SearchSuggestionsProps) {
  return (
    <ul
      id={listboxId}
      role="listbox"
      className="absolute z-50 left-0 right-0"
      style={{
        marginTop: '6px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        padding: '4px',
      }}
    >
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex
        return (
          <li
            key={suggestion.id}
            id={`${listboxId}-option-${index}`}
            role="option"
            aria-selected={isActive}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(suggestion.id, suggestion.path)
            }}
            onMouseEnter={() => onActiveIndexChange(index)}
            onMouseLeave={() => onActiveIndexChange(-1)}
            className="flex items-center justify-between cursor-pointer transition-colors"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#1e293b',
              backgroundColor: isActive ? '#f0f7fa' : 'transparent',
            }}
          >
            <span style={{ lineHeight: 1.4 }}>
              {highlightMatch(suggestion.title, query)}
            </span>
            <span
              className="shrink-0"
              style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: ds.color('logobla-1', 'surface-tinted'),
                color: '#025169',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                marginLeft: '12px',
              }}
            >
              {(SEARCH_SUBCATEGORY_LABELS as Record<string, string>)[suggestion.info_type ?? ''] ?? suggestion.info_type ?? ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
