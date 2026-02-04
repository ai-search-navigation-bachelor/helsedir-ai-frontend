import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Paragraph,
  Spinner,
  Tabs,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { useSearchStore } from '../stores/searchStore';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchForm } from '../components/ui/SearchForm';
import {
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
  ANBEFALINGER_CATEGORY,
  REGELVERK_CATEGORY,
  RAD_CATEGORY,
} from '../constants/categories';

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

  // Hardcoded category order
  const FIXED_CATEGORIES = [
    { id: TEMASIDE_CATEGORY, label: 'Temaside' },
    { id: RETNINGSLINJE_CATEGORY, label: 'Nasjonalfaglig retningslinje' },
    { id: ANBEFALINGER_CATEGORY, label: 'Anbefalinger' },
    { id: REGELVERK_CATEGORY, label: 'Regelverk' },
    { id: RAD_CATEGORY, label: 'Råd' },
  ];

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
    navigate('/search-new');
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams({ query: searchQuery, category: value });
  };

  if (!searchQuery.trim()) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <SearchForm
          initialValue=""
          onSubmit={handleSearchSubmit}
          onClear={handleSearchClear}
          placeholder="Søk..."
        />
        <Alert>
          <Paragraph>Skriv inn et søkeord for å starte søket.</Paragraph>
        </Alert>
      </div>
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
          {/* Category Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tabs.List>
                <Tabs.Tab value="all">
                  Alle
                  <span className="ml-2 text-gray-600">{categoryCounts['all'] || 0}</span>
                </Tabs.Tab>
                
                {FIXED_CATEGORIES.map(category => (
                  <Tabs.Tab key={category.id} value={category.id}>
                    {category.label}
                    <span className="ml-2 text-gray-600">{categoryCounts[category.id] || 0}</span>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <Paragraph className="text-gray-700">
              {sortedResults.length} treff på {searchQuery}
            </Paragraph>
          </div>

          {/* Results List */}
          {sortedResults.length === 0 ? (
            <Alert>
              <Paragraph>Ingen resultater funnet i denne kategorien.</Paragraph>
            </Alert>
          ) : (
            <div className="space-y-4">
              {sortedResults.map((result, index) => (
                <div
                  key={`${result.id}-${index}`}
                  className="bg-white border-l-4 border-blue-500 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/content/${result.id}?search_id=${data.search_id}`)}
                >
                  {/* Category Label */}
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
                      {result.categoryName}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {result.title}
                  </h3>

                  {/* Explanation if available */}
                  {result.explanation && (
                    <p className="text-gray-700 line-clamp-2">
                      {result.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
