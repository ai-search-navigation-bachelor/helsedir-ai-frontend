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
    // Fokuser kun hvis vi ikke er på hjemmesiden og søkebaren åpnes
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
    
    // Lukk søkebaren på andre sider enn hovedsiden
    if (!isHome) {
      window.dispatchEvent(new Event('closeSearch'))
    }
  }

  return (
    <div 
      style={{ 
        backgroundColor: colors.headerBg,
        padding: '2rem 1rem',
        minHeight: '100px',
        borderBottomRightRadius: '50px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Label htmlFor="home-search" style={{fontWeight: 'bold'}}>
          Hva leter du etter?
        </Label>
        
        <form onSubmit={onSubmit}>
          <SearchComponent>
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
