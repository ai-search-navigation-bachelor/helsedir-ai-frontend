import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { HomeSearchForm } from '../components/ui/HomeSearchForm'
import { CategoryButtons } from '../components/ui/CategoryButtons'

type HomeProps = {
  isSearchBar?: boolean
}

export function Home({ isSearchBar = false }: HomeProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isHome = location.pathname === '/'
  const isSearchPage = location.pathname === '/search'
  const searchQueryFromUrl = searchParams.get('query') || ''

  useEffect(() => {
    // Auto-focus when opened as search bar from header or when on home page
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchBar])

  useEffect(() => {
    // Focus search when the header search button is clicked.
    const handleSearchFocus = () => {
      const shouldFocus = isHome || (isSearchBar && isSearchPage)
      if (shouldFocus && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      }
    }
    window.addEventListener('toggleSearch', handleSearchFocus)
    return () => window.removeEventListener('toggleSearch', handleSearchFocus)
  }, [isHome, isSearchBar, isSearchPage])

  useEffect(() => {
    // Keep the header search field synced with /search?query=...
    if (isSearchBar && isSearchPage) {
      setQuery(searchQueryFromUrl)
    }
  }, [isSearchBar, isSearchPage, searchQueryFromUrl])

  // Add home-page class only on the home route
  useEffect(() => {
    if (!isHome) return
    document.body.classList.add('home-page')
    return () => {
      document.body.classList.remove('home-page')
    }
  }, [isHome])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (isSearchPage) {
      setSearchParams({ query: trimmed })
      return
    }

    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  function onClear() {
    if (isSearchPage) {
      setSearchParams({})
    }
  }

  // If used as search bar only, render just the search form
  if (isSearchBar) {
    return (
      <HomeSearchForm 
        ref={searchInputRef}
        query={query}
        onQueryChange={setQuery}
        onSubmit={onSubmit}
        onClear={onClear}
      />
    )
  }

  // Full home page with search and category buttons
  return (
    <div>
      <HomeSearchForm 
        ref={searchInputRef}
        query={query}
        onQueryChange={setQuery}
        onSubmit={onSubmit}
        onClear={onClear}
      />
      <CategoryButtons />
    </div>
  )
}
