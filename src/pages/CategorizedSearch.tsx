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
import { FilterBar } from '../components/ui/FilterBar';
import { useSearchStore } from '../stores/searchStore';
import {
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
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
  const filters = useSearchStore((state) => state.filters);

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
    tema: filters.tema,
    innholdstype: filters.innholdstype,
  });

  // Store search_id in Zustand when data is received
  useEffect(() => {
    if (data?.search_id && searchQuery) {
      setSearchData(data.search_id, searchQuery);
    }
  }, [data?.search_id, searchQuery, setSearchData]);

  // DEBUG: Log full API response
  useEffect(() => {
    if (data) {
      console.log('=== FULL API RESPONSE ===');
      console.log('Query:', data.query);
      console.log('Total results:', data.total);
      console.log('Search ID:', data.search_id);
      console.log('Min score:', data.min_score);
      console.log('\nPRIORITY CATEGORIES:', data.priority_categories.length);
      data.priority_categories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. "${cat.category}" - ${cat.display_name} (${cat.count} results, ${cat.results.length} previews)`);
      });
      console.log('\nOTHER CATEGORIES:', data.other_categories.length);
      data.other_categories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. "${cat.category}" - ${cat.display_name} (${cat.count} results, ${cat.results.length} previews)`);
      });
      console.log('\nALL CATEGORIES COMBINED:');
      const allCats = [...data.priority_categories, ...data.other_categories];
      allCats.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. "${cat.category}" - ${cat.display_name} (${cat.count} results)`);
      });
      console.log('========================\n');
    }
  }, [data]);

  // Combine all categories (priority first, then others)
  const allCategories = [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || [])
  ];

  // Render appropriate card component based on category type
  function renderCategoryCard(category: typeof allCategories[0]) {
    const { category: categoryId } = category;

    // Use specialized card for Temaside
    if (categoryId === TEMASIDE_CATEGORY) {
      return (
        <TemaSideCard
          key={categoryId}
          category={category}
          searchQuery={searchQuery}
          searchId={data?.search_id}
        />
      );
    }

    // Use specialized card for Retningslinje
    if (categoryId === RETNINGSLINJE_CATEGORY) {
      return (
        <RetningslinjeCard
          key={categoryId}
          category={category}
          searchQuery={searchQuery}
          searchId={data?.search_id}
        />
      );
    }

    // Use regular card for all other categories
    return (
      <RegularCategoryCard
        key={categoryId}
        category={category}
        searchQuery={searchQuery}
        searchId={data?.search_id}
      />
    );
  }

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

      {searchQuery && <FilterBar />}

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
            <p className="text-sm text-slate-500">
              {data.total} treff på {searchQuery}
            </p>
          </div>

          {data.total === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Ingen resultater funnet for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Dynamically render all categories returned by API */}
              {allCategories.map(renderCategoryCard)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
