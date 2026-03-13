import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchForm } from './SearchForm'
import { buildContentUrl } from '../../lib/contentUrl'
import { useTemasidePathMap } from '../../hooks/queries/useTemasidePathMap'

interface SearchShellContentProps {
  focusRequest: number
}

function SearchShellContent({ focusRequest }: SearchShellContentProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isSearchPage = location.pathname === '/search'
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const [query, setQuery] = useState(isSearchPage ? searchQueryFromUrl : '')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const temasidePathById = useTemasidePathMap()
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      if (focusRequest === 0 && !isSearchPage) return
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [focusRequest, isSearchPage])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (isSearchPage) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('query', trimmed)
      setSearchParams(nextParams)
      return
    }

    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  function onClear() {
    // Only clear the input text, don't touch URL params or search results
  }

  function onSuggestionSelect(id: string) {
    navigate(temasidePathById.get(id) || buildContentUrl({ id }))
  }

  return (
    <SearchForm
      ref={searchInputRef}
      query={query}
      onQueryChange={setQuery}
      onSubmit={onSubmit}
      onClear={onClear}
      onSuggestionSelect={onSuggestionSelect}
    />
  )
}

interface SearchShellProps {
  focusRequest?: number
}

export function SearchShell({ focusRequest = 0 }: SearchShellProps) {
  const location = useLocation()
  const isSearchPage = location.pathname === '/search'
  const [searchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const querySyncKey = isSearchPage ? `search:${searchQueryFromUrl}` : 'local'

  return <SearchShellContent key={querySyncKey} focusRequest={focusRequest} />
}
