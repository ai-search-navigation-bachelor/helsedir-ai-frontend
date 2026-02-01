import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { TemaSideCard, RetningslinjeCard, RegularCategoryCard } from '../components/search';
import { SearchForm } from '../components/ui/SearchForm';
import { useSearchStore } from '../stores/searchStore';
import {
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
  ANBEFALINGER_CATEGORY,
  REGELVERK_CATEGORY,
  RAD_CATEGORY,
} from '../constants/categories';

/**
 * Categorized Search Page
 * Displays search results organized by categories with different card styles
 */
export function CategorizedSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('query') || '';
  
  const setSearchData = useSearchStore((state) => state.setSearchData);

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
  });

  // Store search_id in Zustand when data is received
  useEffect(() => {
    if (data?.search_id && searchQuery) {
      setSearchData(data.search_id, searchQuery);
    }
  }, [data?.search_id, searchQuery, setSearchData]);

  // Create mock Temaside if not in database
  const temasideCategory =
    data?.priority_categories.find((cat) => cat.category === TEMASIDE_CATEGORY) ||
    data?.other_categories.find((cat) => cat.category === TEMASIDE_CATEGORY) ||
    (data ? {
      category: TEMASIDE_CATEGORY,
      display_name: 'Temaside',
      count: 0,
      results: [],
    } : undefined);

  const retningslinjeCategory =
    data?.priority_categories.find((cat) => cat.category === RETNINGSLINJE_CATEGORY) ||
    data?.other_categories.find((cat) => cat.category === RETNINGSLINJE_CATEGORY);

  // Get exactly the 3 other categories in order: Anbefalinger, Regelverk, Råd
  const allCategories = [...(data?.priority_categories || []), ...(data?.other_categories || [])];
  
  // Debug: Log available categories
  if (data) {
    console.log('Available categories:', allCategories.map(cat => `"${cat.category}"`));
    console.log('Looking for:', { ANBEFALINGER_CATEGORY, REGELVERK_CATEGORY, RAD_CATEGORY });
  }
  
  const anbefalingerCategory = allCategories.find((cat) => cat.category === ANBEFALINGER_CATEGORY);
  const regelverkCategory = allCategories.find((cat) => cat.category === REGELVERK_CATEGORY);
  const radCategory = allCategories.find((cat) => cat.category === RAD_CATEGORY);

  if (data) {
    console.log('Found categories:', {
      anbefalinger: anbefalingerCategory?.category || 'NOT FOUND',
      regelverk: regelverkCategory?.category || 'NOT FOUND',
      rad: radCategory?.category || 'NOT FOUND',
    });
  }

  const bottomThreeCategories = [anbefalingerCategory, regelverkCategory, radCategory].filter(Boolean);

  function handleSearch(query: string) {
    navigate(`/search?query=${encodeURIComponent(query)}`)
  }

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-8">
      <div className="mt-6">
        <SearchForm
          initialValue={searchQuery}
          onSubmit={handleSearch}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner aria-label="Søker..." data-size="lg" />
        </div>
      )}

      {error && (
        <Alert data-color="danger">
          <Paragraph>{error instanceof Error ? error.message : 'Søket feilet'}</Paragraph>
        </Alert>
      )}

      {data && !isLoading && !error && (
        <>
          {/* Search Results Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {searchQuery.toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500">
              {data.total} treff på {searchQuery.toUpperCase()}
            </p>
          </div>

          {data.total === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Ingen resultater funnet for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Box 1: Temaside - Always show (mock if not in DB) */}
              {temasideCategory && (
                <TemaSideCard category={temasideCategory} searchQuery={searchQuery} searchId={data.search_id} />
              )}

              {/* Box 2: Retningslinje */}
              {retningslinjeCategory && (
                <RetningslinjeCard category={retningslinjeCategory} searchQuery={searchQuery} searchId={data.search_id} />
              )}

              {/* Boxes 3-5: Anbefalinger, Regelverk, Råd */}
              {bottomThreeCategories.map((category) => (
                <RegularCategoryCard key={category.category} category={category} searchQuery={searchQuery} searchId={data.search_id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
