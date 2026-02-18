import { Alert, Paragraph, Spinner } from '@digdir/designsystemet-react'
import {
  SearchCategoryTabs,
  SearchEmptyState,
  SearchResultsList,
} from '../components/search'
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
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Spinner aria-label="Laster søkeresultater..." data-size="lg" />
        </div>
      )}

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
