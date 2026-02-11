import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchForm } from './SearchForm'

export function SearchShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSearchPage = location.pathname === '/search'
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const [query, setQuery] = useState(isSearchPage ? searchQueryFromUrl : '')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchPage) {
      setQuery(searchQueryFromUrl)
    }
  }, [isSearchPage, searchQueryFromUrl])

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
    if (isSearchPage) {
      setSearchParams({})
    }
  }

  return (
    <SearchForm
      ref={searchInputRef}
      query={query}
      onQueryChange={setQuery}
      onSubmit={onSubmit}
      onClear={onClear}
    />
  )
}
