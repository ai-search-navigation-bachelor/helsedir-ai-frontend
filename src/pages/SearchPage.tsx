import { Alert, Paragraph } from '@digdir/designsystemet-react'
import {
  SearchCategoryTabs,
  SearchEmptyState,
  SearchResultsList,
} from '../components/search'
import { SearchPageLoadingSkeleton } from '../components/search/SearchSkeletons'
import { useSearchPageModel } from '../hooks/useSearchPageModel'

/**
 * Search page with tab-based navigation across main categories.
 */
export function SearchPage() {
  const {
    activeTab,
    activeTabLabel,
    data,
    error,
    handleTabChange,
    hasQuery,
    isLoading,
    mainCategoryCounts,
    searchQuery,
    sortedResults,
    tabs,
  } = useSearchPageModel()

  if (!hasQuery) {
    return <SearchEmptyState />
  }

  return (
    <div className="max-w-screen-xl mx-auto px-12 pt-2 pb-6">
      {isLoading && <SearchPageLoadingSkeleton />}

      {error && (
        <Alert>
          <Paragraph>Det oppstod en feil ved søket. Vennligst prøv igjen.</Paragraph>
        </Alert>
      )}

      {!isLoading && !error && data && (
        <>
          <SearchCategoryTabs
            activeTab={activeTab}
            tabs={tabs}
            categoryCounts={mainCategoryCounts}
            onTabChange={handleTabChange}
          />

          <SearchResultsList
            results={sortedResults}
            searchQuery={searchQuery}
            activeTab={activeTab}
            activeTabLabel={activeTabLabel}
          />
        </>
      )}
    </div>
  )
}
