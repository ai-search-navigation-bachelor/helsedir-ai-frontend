import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HomeSearchForm } from '../components/ui/HomeSearchForm'

type HomeProps = {
  isSearchBar?: boolean
}

export function Home({ isSearchBar = false }: HomeProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isHome = location.pathname === '/'

  useEffect(() => {
    // Auto-focus when opened as search bar from header or when on home page
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchBar])

  useEffect(() => {
    // Listen for search toggle event on home page
    const handleSearchFocus = () => {
      if (isHome && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      }
    }
    window.addEventListener('toggleSearch', handleSearchFocus)
    return () => window.removeEventListener('toggleSearch', handleSearchFocus)
  }, [isHome])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  return (
    <HomeSearchForm 
      ref={searchInputRef}
      query={query}
      onQueryChange={setQuery}
      onSubmit={onSubmit}
    />
  )
}
