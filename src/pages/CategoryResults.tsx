import { useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'

import { useCategorySearchQuery } from '../hooks/queries/useCategorySearchQuery'
import { ResultItem } from '../components/search'
import { SearchForm } from '../components/ui/SearchForm'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useSearchStore } from '../stores/searchStore'
import type { BreadcrumbItem } from '../types/components'

export function CategoryResults() {
  const { category = '' } = useParams<{ category: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchQuery = searchParams.get('query') || ''
  const searchId = useSearchStore((state) => state.searchId)

  const effectiveSearchId = searchId || ''
  
  const [itemsToShow, setItemsToShow] = useState(20)

  const { data, isLoading, error } = useCategorySearchQuery(searchQuery, category, {
    search_id: effectiveSearchId,
    enabled: !!searchQuery.trim() && !!category && !!effectiveSearchId,
  })

  function handleSearch(query: string) {
    navigate(`/search?query=${encodeURIComponent(query)}`)
  }

  function handleLoadMore() {
    setItemsToShow(prev => prev + 20)
  }

  const visibleResults = data?.results.slice(0, itemsToShow) || []
  const hasMore = (data?.results.length || 0) > itemsToShow

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Forside', href: '/' },
    { 
      label: searchQuery.toUpperCase(), 
      href: `/search?query=${encodeURIComponent(searchQuery)}`,
      icon: <MagnifyingGlassIcon style={{ width: '16px', height: '16px' }} />
    },
    { label: data?.category || category, href: '#' }
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Breadcrumb items={breadcrumbItems} />

      <SearchForm
        initialValue={searchQuery}
        onSubmit={handleSearch}
      />

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
