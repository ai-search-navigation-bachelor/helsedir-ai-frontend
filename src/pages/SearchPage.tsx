import { Alert, Paragraph } from "@digdir/designsystemet-react";
import {
  SearchCategoryTabs,
  SearchEmptyState,
  SearchResultsList,
} from "../components/search";
import { SearchResultsLoadingSkeleton } from "../components/search/SearchSkeletons";
import { useSearchPageModel } from "../hooks/useSearchPageModel";
import { Skeleton } from "@digdir/designsystemet-react";

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
  } = useSearchPageModel();

  if (!hasQuery) {
    return <SearchEmptyState />;
  }

  const hasStableCategoryCounts = Object.keys(mainCategoryCounts).length > 0;
  const isLoadingCounts = isLoading && !hasStableCategoryCounts;

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-6 sm:px-6 lg:px-12">
      {error && (
        <Alert>
          <Paragraph>
            Det oppstod en feil ved sÃ¸ket. Vennligst prÃ¸v igjen.
          </Paragraph>
        </Alert>
      )}

      {!error && (
        <>
          <SearchCategoryTabs
            activeTab={activeTab}
            tabs={tabs}
            categoryCounts={mainCategoryCounts}
            isLoadingCounts={isLoadingCounts}
            onTabChange={handleTabChange}
          />

          {isLoading && (
            <div className="mb-3" aria-hidden="true">
              <Skeleton width={150} height={19} className="rounded" />
            </div>
          )}

          {isLoading ? (
            <SearchResultsLoadingSkeleton />
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}
