import { useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'

import { useCategorySearchQuery } from '../hooks/queries/useCategorySearchQuery'
import { ResultItem } from '../components/search'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useSearchStore } from '../stores/searchStore'
import type { BreadcrumbItem } from '../types/components'

export function CategoryResults() {
  const { category = '' } = useParams<{ category: string }>()
  const [searchParams] = useSearchParams()

  const searchQuery = searchParams.get('query') || ''
  const searchId = useSearchStore((state) => state.searchId)

  const effectiveSearchId = searchId || ''

  const [itemsToShow, setItemsToShow] = useState(20)

  // Helper function to capitalize category name
  const formatCategoryName = (cat: string) => {
    return cat
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const { data, isLoading, error } = useCategorySearchQuery(searchQuery, category, {
    search_id: effectiveSearchId,
    enabled: !!searchQuery.trim() && !!category && !!effectiveSearchId,
  })

  function handleLoadMore() {
    setItemsToShow(prev => prev + 20)
  }

  const visibleResults = data?.results.slice(0, itemsToShow) || []
  const hasMore = (data?.results.length || 0) > itemsToShow

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Forside', href: '/' },
    {
      label: searchQuery,
      href: `/search?query=${encodeURIComponent(searchQuery)}`,
      icon: <MagnifyingGlassIcon style={{ width: '18px', height: '18px' }} />
    },
    { label: formatCategoryName(data?.category || category), href: '#' }
  ]

  return (
    <div className="max-w-screen-xl mx-auto px-8 pt-4 pb-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-1 m-0">
              {formatCategoryName(data.category || category)}
            </h1>
            <p className="text-sm text-slate-500 m-0">
              {data.total} treff
            </p>
          </div>

          {/* Results List */}
          {data.results.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Paragraph style={{ color: '#64748b', margin: 0 }}>
                Ingen resultater funnet
              </Paragraph>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {visibleResults.map((result) => (
                  <ResultItem key={result.id} result={result} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
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
