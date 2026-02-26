import { Alert, Paragraph } from '@digdir/designsystemet-react'
import {
  SearchCategoryTabs,
  SearchEmptyState,
  SearchResultsList,
} from '../components/search'
import { SearchPageLoadingSkeleton } from '../components/search/SearchSkeletons'
import { useSearchPageModel } from '../hooks/useSearchPageModel'

/**
 * Search page with tab-based navigation and infinite scroll.
 */
export function SearchPage() {
  const {
    activeTab,
    activeTabLabel,
    allResults,
    error,
    fetchNextPage,
    handleTabChange,
    hasNextPage,
    hasQuery,
    isFetchingNextPage,
    isLoading,
    mainCategoryCounts,
    searchQuery,
    tabs,
    total,
  } = useSearchPageModel()

  if (!hasQuery) {
    return <SearchEmptyState />
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-6 sm:px-6 lg:px-12">
      {isLoading && <SearchPageLoadingSkeleton />}

      {error && (
        <Alert>
          <Paragraph>Det oppstod en feil ved søket. Vennligst prøv igjen.</Paragraph>
        </Alert>
      )}

      {!isLoading && !error && allResults && (
        <>
          <SearchCategoryTabs
            activeTab={activeTab}
            tabs={tabs}
            categoryCounts={mainCategoryCounts}
            onTabChange={handleTabChange}
          />

          <SearchResultsList
            results={allResults}
            searchQuery={searchQuery}
            activeTab={activeTab}
            activeTabLabel={activeTabLabel}
            total={total}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </>
      )}
    </div>
  )
}
