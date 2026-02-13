import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { useSearchStore } from '../stores/searchStore';
import {
  SearchCategoryTabs,
  SearchResultsList,
  SearchEmptyState,
} from '../components/content/search';
import {
  SEARCH_SUBCATEGORY_LABELS,
  SEARCH_MAIN_CATEGORIES,
  getMainCategoryBySubcategory,
} from '../constants/categories';

const MAIN_CATEGORY_IDS: ReadonlySet<string> = new Set(
  SEARCH_MAIN_CATEGORIES.map((category) => category.id),
);

function isMainCategoryId(value: string): value is (typeof SEARCH_MAIN_CATEGORIES)[number]['id'] {
  return MAIN_CATEGORY_IDS.has(value);
}

const MAIN_TAB_ORDER = [
  'temaside',
  'retningslinjer',
  'faglige-rad',
  'veiledere',
  'rundskriv',
  'lovfortolkning',
  'statistikk-og-rapporter',
] as const;

/**
 * New Search Page
 * Modern search interface with tab-based category navigation
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('query') || '';
  const rawCategory = (searchParams.get('category') || 'all').trim().toLowerCase();
  const activeTab = useMemo(() => {
    if (rawCategory === 'all') return 'all';
    if (isMainCategoryId(rawCategory)) return rawCategory;
    return getMainCategoryBySubcategory(rawCategory) || 'all';
  }, [rawCategory]);

  const searchQueryFromStore = useSearchStore((state) => state.searchQuery);
  const setSearchId = useSearchStore((state) => state.setSearchId);
  const setSearchData = useSearchStore((state) => state.setSearchData);

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
  });

  // Clear stale search_id when URL query changes
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || searchQueryFromStore !== trimmedQuery) {
      setSearchId(null);
    }
  }, [searchQuery, searchQueryFromStore, setSearchId]);

  // Store search_id in Zustand when data is received
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (data?.search_id && trimmedQuery) {
      setSearchData(data.search_id, trimmedQuery);
    }
  }, [data?.search_id, searchQuery, setSearchData]);

  const allCategories = useMemo(
    () => [...(data?.priority_categories || []), ...(data?.other_categories || [])],
    [data?.priority_categories, data?.other_categories]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCategories.forEach((cat) => {
      counts[cat.category] = cat.results.length;
    });
    const total = allCategories.reduce((sum, cat) => sum + cat.results.length, 0);
    counts.all = total;
    return counts;
  }, [allCategories]);

  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = { ...SEARCH_SUBCATEGORY_LABELS };
    allCategories.forEach((categoryGroup) => {
      labels[categoryGroup.category] = categoryGroup.display_name || categoryGroup.category;
    });
    return labels;
  }, [allCategories]);

  const tabs = useMemo(
    () => {
      const byId = new Map(SEARCH_MAIN_CATEGORIES.map((category) => [category.id, category]));
      return MAIN_TAB_ORDER.map((id) => byId.get(id)).filter(Boolean).map((category) => ({
        id: category!.id,
        label: category!.label,
      }));
    },
    [],
  );

  const mainCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    SEARCH_MAIN_CATEGORIES.forEach((mainCategory) => {
      counts[mainCategory.id] = mainCategory.subcategoryIds.reduce(
        (sum, subcategoryId) => sum + (categoryCounts[subcategoryId] || 0),
        0,
      );
    });

    counts.all = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return counts;
  }, [categoryCounts]);

  const activeTabLabel = useMemo(() => {
    if (activeTab === 'all') {
      return 'Alle';
    }
    return tabs.find((tab) => tab.id === activeTab)?.label || '';
  }, [activeTab, tabs]);

  const filteredResults = useMemo(() => {
    if (activeTab === 'all') {
      return allCategories.flatMap((cat) =>
        cat.results.map((result) => ({
          ...result,
          categoryName: categoryLabels[cat.category] || cat.display_name || cat.category,
          categoryId: cat.category,
        }))
      );
    }

    const selectedMainCategory = SEARCH_MAIN_CATEGORIES.find((category) => category.id === activeTab);
    if (!selectedMainCategory) {
      return [];
    }

    const allowedSubcategories = new Set<string>(selectedMainCategory.subcategoryIds);

    return allCategories
      .filter((cat) => allowedSubcategories.has(cat.category))
      .flatMap((cat) =>
        cat.results.map((result) => ({
          ...result,
          categoryName: categoryLabels[cat.category] || cat.display_name || cat.category,
          categoryId: cat.category,
        })),
      );
  }, [activeTab, allCategories, categoryLabels]);

  useEffect(() => {
    if (rawCategory === activeTab) return;
    setSearchParams(
      {
        query: searchQuery,
        category: activeTab,
      },
      { replace: true },
    );
  }, [activeTab, rawCategory, searchQuery, setSearchParams]);

  // Sort results by score
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      if (a.score && b.score) {
        return b.score - a.score;
      }
      return 0;
    });
  }, [filteredResults]);

  const handleTabChange = (value: string) => {
    setSearchParams({
      query: searchQuery,
      category: value,
    });
  };

  if (!searchQuery.trim()) {
    return <SearchEmptyState />;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-2 pb-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Spinner aria-label="Laster søkeresultater..." data-size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert>
          <Paragraph>Det oppstod en feil ved søket. Vennligst prøv igjen.</Paragraph>
        </Alert>
      )}

      {/* Results */}
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
  );
}
