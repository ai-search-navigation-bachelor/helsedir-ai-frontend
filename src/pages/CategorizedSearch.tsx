import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Heading,
  Paragraph,
  Search as SearchComponent,
  Spinner,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { TemaSideCard, RetningslinjeCard, RegularCategoryCard } from '../components/search';

// Special category handling
const TEMASIDE_CATEGORY = 'temaside';
const RETNINGSLINJE_CATEGORY = 'retningslinje';

/**
 * Categorized Search Page
 * Displays search results organized by categories with different card styles
 */
export function CategorizedSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('query') || '';
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
  });

  // Separate categories by type
  const temasideCategory =
    data?.priority_categories.find((cat) => cat.category === TEMASIDE_CATEGORY) ||
    data?.other_categories.find((cat) => cat.category === TEMASIDE_CATEGORY);

  const retningslinjeCategory =
    data?.priority_categories.find((cat) => cat.category === RETNINGSLINJE_CATEGORY) ||
    data?.other_categories.find((cat) => cat.category === RETNINGSLINJE_CATEGORY);

  // Get other categories (excluding temaside and retningslinje)
  const otherCategories = [...(data?.priority_categories || []), ...(data?.other_categories || [])].filter(
    (cat) => cat.category !== TEMASIDE_CATEGORY && cat.category !== RETNINGSLINJE_CATEGORY && cat.results.length > 0
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (trimmed) {
        next.set('query', trimmed);
      } else {
        next.delete('query');
      }
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="mb-6">
        <SearchComponent>
          <SearchComponent.Input
            name="query"
            aria-label="Søk"
            placeholder="Søk etter innhold…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <SearchComponent.Clear
            aria-label="Tøm"
            onClick={(e) => {
              e.preventDefault();
              setInputValue('');
              navigate('/categorized');
            }}
          />
          <SearchComponent.Button type="submit" variant="secondary">
            Søk
          </SearchComponent.Button>
        </SearchComponent>
      </form>

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
          <div className="mb-6">
            <h2 className="text-3xl mb-2">{searchQuery.toUpperCase()}</h2>
            <p className="text-slate-600">
              {data.total} treff på {searchQuery.toUpperCase()}
            </p>
          </div>

          {data.total === 0 ? (
            <div className="text-center py-12">
              <Paragraph className="text-gray-600">Ingen resultater funnet for "{searchQuery}"</Paragraph>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Temaside - always first */}
              {temasideCategory && temasideCategory.results.length > 0 && (
                <TemaSideCard category={temasideCategory} searchQuery={searchQuery} searchId={data.search_id} />
              )}

              {/* Retningslinje - always second */}
              {retningslinjeCategory && retningslinjeCategory.results.length > 0 && (
                <RetningslinjeCard category={retningslinjeCategory} searchQuery={searchQuery} searchId={data.search_id} />
              )}

              {/* Other categories */}
              {otherCategories.map((category) => (
                <RegularCategoryCard key={category.category} category={category} searchQuery={searchQuery} searchId={data.search_id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
