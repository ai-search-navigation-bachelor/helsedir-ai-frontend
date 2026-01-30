import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Paragraph,
  Search as SearchComponent,
  Spinner,
} from '@digdir/designsystemet-react'
import { ChevronRightIcon, MagnifyingGlassIcon } from '@navikt/aksel-icons'

import { useCategorySearchQuery } from '../hooks/queries/useCategorySearchQuery'
import type { CategorySearchResult } from '../api/categorySearch'
import { CategoryResultItem } from '../components/search/CategoryResultItem'
import { useSearchStore } from '../stores/searchStore'

function ResultItem({ result }: { result: CategorySearchResult }) {
  return (
    <Link 
      to={`/content/${result.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <a
        href={`/content/${result.id}`}
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `/content/${result.id}`;
        }}
        style={{
          display: 'block',
          padding: '16px 20px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <CategoryResultItem 
          result={result} 
          variant="regular"
        />
      </a>
    </Link>
  )
}

export function CategoryResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const searchQuery = searchParams.get('query') || ''
  const category = searchParams.get('category') || ''
  const searchId = searchParams.get('search_id') || ''
  
  const storedSearchId = useSearchStore((state) => state.searchId)
  const effectiveSearchId = searchId || storedSearchId || ''
  
  const [inputValue, setInputValue] = useState(searchQuery)
  const [itemsToShow, setItemsToShow] = useState(20)

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const { data, isLoading, error } = useCategorySearchQuery(searchQuery, category, {
    search_id: effectiveSearchId,
    enabled: !!searchQuery.trim() && !!category && !!effectiveSearchId,
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleLoadMore() {
    setItemsToShow(prev => prev + 20)
  }

  const visibleResults = data?.results.slice(0, itemsToShow) || []
  const hasMore = (data?.results.length || 0) > itemsToShow

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Breadcrumbs */}
      <nav style={{ marginBottom: '24px' }}>
        <ol style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          fontSize: '14px',
          color: '#64748b'
        }}>
          <li>
            <Link 
              to="/"
              style={{ 
                color: '#2563eb', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Forside
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link 
              to={`/search?query=${encodeURIComponent(searchQuery)}`}
              style={{ 
                color: '#2563eb', 
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              <MagnifyingGlassIcon style={{ width: '16px', height: '16px' }} />
              {searchQuery.toUpperCase()}
            </Link>
          </li>
          <li style={{ color: '#0f172a', fontWeight: '500' }}>
            - {data?.category || category}
          </li>
        </ol>
      </nav>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <SearchComponent>
          <SearchComponent.Input
            name="query"
            aria-label='Søk'
            placeholder='Søk etter innhold…'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <SearchComponent.Clear
            aria-label='Tøm'
            onClick={(e) => {
              e.preventDefault()
              setInputValue('')
            }}
          />
          <SearchComponent.Button type='submit' variant='secondary'>
            Søk
          </SearchComponent.Button>
        </SearchComponent>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spinner aria-label="Laster..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Kunne ikke laste resultater'}
          </Paragraph>
        </Alert>
      )}

      {/* Results */}
      {data && !isLoading && !error && (
        <>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#0f172a', 
              margin: 0,
              marginBottom: '4px'
            }}>
              {(data.category || category).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {data.total} treff
            </p>
          </div>

          {/* Results List */}
          {data.results.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <Paragraph style={{ color: '#64748b', margin: 0 }}>
                Ingen resultater funnet
              </Paragraph>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleResults.map((result) => (
                  <ResultItem key={result.id} result={result} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={handleLoadMore}
                    data-size="lg"
                  >
                    Last flere ({data.total - itemsToShow} til)
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
