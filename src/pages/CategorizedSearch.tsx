import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Paragraph,
  Spinner,
} from '@digdir/designsystemet-react';

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery';
import { TemaSideCard, RetningslinjeCard, RegularCategoryCard } from '../components/search';
import { CategorySidebar } from '../components/search/CategorySidebar';
import { SearchForm } from '../components/ui/SearchForm';
import { FilterBar } from '../components/ui/FilterBar';
import { useSearchStore } from '../stores/searchStore';
import {
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
} from '../constants/categories';

/**
 * Categorized Search Page
 * Displays search results organized by categories with sidebar navigation
 */
export function CategorizedSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('query') || '';

  const setSearchData = useSearchStore((state) => state.setSearchData);
  const filters = useSearchStore((state) => state.filters);

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
  const allCategories = useMemo(() => [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || [])
  ], [data?.priority_categories, data?.other_categories]);

  // Track active category with intersection observer
  useEffect(() => {
    if (allCategories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id.replace('category-', '');
            setActiveCategory(categoryId);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0.1 }
    );

    allCategories.forEach((cat) => {
      const element = document.getElementById(`category-${cat.category}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [allCategories]);

  // Scroll to category when clicked in sidebar
  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset from top

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Toggle collapse for a category (only for regular categories, not temaside/retningslinje)
  const toggleCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Render appropriate card component based on category type
  function renderCategoryCard(category: typeof allCategories[0]) {
    const { category: categoryId } = category;

    // Use specialized card for Temaside (always expanded, no collapse)
    if (categoryId === TEMASIDE_CATEGORY) {
      return (
        <TemaSideCard
          key={categoryId}
          category={category}
        />
      );
    }

    // Use specialized card for Retningslinje (always expanded, no collapse)
    if (categoryId === RETNINGSLINJE_CATEGORY) {
      return (
        <RetningslinjeCard
          key={categoryId}
          category={category}
        />
      );
    }

    // Use regular card for all other categories (collapsible)
    const isCollapsed = collapsedCategories.has(categoryId);
    return (
      <RegularCategoryCard
        key={categoryId}
        category={category}
        searchQuery={searchQuery}
        searchId={data?.search_id}
        isExpanded={!isCollapsed}
        onToggle={() => toggleCollapse(categoryId)}
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr',
                gap: '32px',
              }}
            >
              {/* Left sidebar - Category navigation */}
              <CategorySidebar
                categories={allCategories}
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
              />

              {/* Right content - Category cards */}
              <div className="flex flex-col">
                {allCategories.map(renderCategoryCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
