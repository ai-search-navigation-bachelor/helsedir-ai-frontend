import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { HomeSearchForm } from '../components/ui/HomeSearchForm'
import { CategoryButtons } from '../components/ui/CategoryButtons'

type HomeProps = {
  isSearchBar?: boolean
}

export function Home({ isSearchBar = false }: HomeProps) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearchPage = location.pathname === '/search'
  const [searchParams] = useSearchParams()
  const searchQueryFromUrl = searchParams.get('query') || ''
  const querySyncKey = isSearchBar && isSearchPage ? `search:${searchQueryFromUrl}` : 'local'
  const initialQuery = isSearchBar && isSearchPage ? searchQueryFromUrl : ''

  return (
    <HomeInner
      key={querySyncKey}
      isSearchBar={isSearchBar}
      isHome={isHome}
      isSearchPage={isSearchPage}
      initialQuery={initialQuery}
    />
  )
}

type HomeInnerProps = {
  isSearchBar: boolean
  isHome: boolean
  isSearchPage: boolean
  initialQuery: string
}

function HomeInner({ isSearchBar, isHome, isSearchPage, initialQuery }: HomeInnerProps) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // If used as search bar only, render just the search form
  if (isSearchBar) {
    return (
      <HomeSearchForm 
        ref={searchInputRef}
        query={query}
        onQueryChange={setQuery}
        onSubmit={onSubmit}
        onClear={onClear}
        inHeaderBar={isSearchBar}
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
        inHeaderBar={false}
      />
      <CategoryButtons />
    </div>
  )
}
