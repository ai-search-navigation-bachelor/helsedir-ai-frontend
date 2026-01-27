import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Label,
  Search as SearchComponent,
} from '@digdir/designsystemet-react'
import { colors } from '../styles/dsTokens'

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
    // Focus only when not on the home page and the search bar opens
    if (isSearchBar && !isHome && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchBar, isHome])

  useEffect(() => {
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
    navigate(`/search?searchquery=${encodeURIComponent(trimmed)}`)
    
    // Close the search bar on pages other than home
    if (!isHome) {
      window.dispatchEvent(new Event('closeSearch'))
    }
  }

  return (
    <div
      className={`search-shell ${isSearchBar ? 'search-shell--bar' : ''}`}
      style={{ backgroundColor: colors.headerBg }}
    >
      <div className='container'>
        <Label htmlFor="home-search" style={{ fontWeight: 'bold' }}>
          Hva leter du etter?
        </Label>
        
        <form onSubmit={onSubmit} className='search-shell__form'>
          <SearchComponent className='search-shell__control'>
            <SearchComponent.Input
              ref={searchInputRef}
              id="home-search"
              aria-label='Søk'
              placeholder='Søk etter innhold…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchComponent.Clear
              aria-label='Tøm'
              onClick={(e) => {
                e.preventDefault()
                setQuery('')
              }}
            />
            <SearchComponent.Button type='submit' variant='secondary'>
              Søk
            </SearchComponent.Button>
          </SearchComponent>
        </form>
      </div>
    </div>
  )
}
