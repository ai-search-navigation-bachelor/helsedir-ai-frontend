import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { useSearchStore } from '../stores/searchStore';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchForm } from '../components/ui/SearchForm';
import {
  SearchCategoryTabs,
  SearchResultsList,
  SearchEmptyState,
  FIXED_CATEGORIES,
} from '../components/new-search';

/**
 * New Search Page
 * Modern search interface with tab-based category navigation
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('query') || '';
  const activeTab = searchParams.get('category') || 'all';

  const setSearchData = useSearchStore((state) => state.setSearchData);
  const filters = useSearchStore((state) => state.filters);

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
    tema: filters.tema,
  });

  // Store search_id in Zustand when data is received
  useEffect(() => {
    if (data?.search_id && searchQuery) {
      setSearchData(data.search_id, searchQuery);
    }
  }, [data?.search_id, searchQuery, setSearchData]);

  // Combine all categories
  const allCategories = useMemo(() => [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || [])
  ], [data?.priority_categories, data?.other_categories]);

  // Get category counts (including 0 for categories with no results)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize all hardcoded categories with 0
    FIXED_CATEGORIES.forEach(cat => {
      counts[cat.id] = 0;
    });
    
    // Count actual preview results (not total count from API)
    allCategories.forEach(cat => {
      counts[cat.category] = cat.results.length;
    });
    
    // Calculate total from actual displayed results
    const total = allCategories.reduce((sum, cat) => sum + cat.results.length, 0);
    counts['all'] = total;
    
    return counts;
  }, [allCategories]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') {
      return allCategories.flatMap(cat => 
        cat.results.map(result => ({
          ...result,
          categoryName: cat.display_name,
          categoryId: cat.category,
        }))
      );
    }
    
    const category = allCategories.find(cat => cat.category === activeTab);
    return category?.results.map(result => ({
      ...result,
      categoryName: category.display_name,
      categoryId: category.category,
    })) || [];
  }, [activeTab, allCategories]);

  // Sort results by score
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      if (a.score && b.score) {
        return b.score - a.score;
      }
      return 0;
    });
  }, [filteredResults]);

  // Handle search submit
  const handleSearchSubmit = (query: string) => {
    setSearchParams({ query, category: activeTab });
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchParams({});
    navigate('/search');
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams({ query: searchQuery, category: value });
  };

  // Early return for empty search
  if (!searchQuery.trim()) {
    return (
      <SearchEmptyState
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
      />
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Search Bar */}
      <SearchForm
        initialValue={searchQuery}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
        placeholder="Søk..."
      />

      {/* Filter Bar */}
      <FilterBar />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
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
            categoryCounts={categoryCounts}
            onTabChange={handleTabChange}
          />

          <SearchResultsList
            results={sortedResults}
            searchQuery={searchQuery}
            searchId={data.search_id}
          />
        </>
      )}
    </div>
  );
}
