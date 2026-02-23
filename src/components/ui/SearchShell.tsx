import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchForm } from './SearchForm'
import { buildContentUrl } from '../../lib/contentUrl'
import { useTemasidePathMap } from '../../hooks/queries/useTemasidePathMap'

function SearchShellContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSearchPage = location.pathname === '/search'
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const [query, setQuery] = useState(isSearchPage ? searchQueryFromUrl : '')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const temasidePathById = useTemasidePathMap()

  useEffect(() => {
    if (!searchInputRef.current) return
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => window.clearTimeout(timer)
  }, [isSearchPage])

  useEffect(() => {
    const handleSearchFocus = () => {
      window.setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }

    window.addEventListener('toggleSearch', handleSearchFocus)
    return () => window.removeEventListener('toggleSearch', handleSearchFocus)
  }, [])

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

export function SearchShell() {
  const location = useLocation()
  const isSearchPage = location.pathname === '/search'
  const [searchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const querySyncKey = isSearchPage ? `search:${searchQueryFromUrl}` : 'local'

  return <SearchShellContent key={querySyncKey} />
}
