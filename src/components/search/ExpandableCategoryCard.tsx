import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@digdir/designsystemet-react';
import { ChevronRightIcon, ChevronDownIcon } from '@navikt/aksel-icons';
import type { CategoryGroup } from '../../api/categorized';
import { CategoryResultItem } from './CategoryResultItem';

type Variant = 'temaside' | 'retningslinje';

export interface ExpandableCategoryCardProps {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
  variant: Variant;
  badgeSuffix?: string;
  previewCount?: number;
  subtitle?: string;
}

export function ExpandableCategoryCard({
  category,
  searchQuery,
  searchId,
  variant,
  badgeSuffix = 'artikler',
  previewCount = 0,
  subtitle,
}: ExpandableCategoryCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const navigateToCategory = () => {
    if (!searchId) return;
    navigate(
      `/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
        category.category
      )}&search_id=${searchId}`
    );
  };

  const visibleResults = useMemo(() => {
    const base = category.results ?? [];
    if (isExpanded) return base;
    if (previewCount <= 0) return [];
    return base.slice(0, previewCount);
  }, [category.results, isExpanded, previewCount]);

  return (
    <div
      className="p-0 overflow-hidden rounded-2xl transition-shadow border-2 border-slate-300/80 ring-1 ring-slate-200/60 bg-white"
      style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={navigateToCategory}
        className="relative block w-full text-left px-8 py-7 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 bg-sky-50 hover:bg-sky-100/70 border-b-2 border-sky-200 before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-blue-600"
      >
        {/* Count badge */}
        <div className="absolute left-6 top-4">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white/80 text-slate-700 border border-sky-200/70">
            {category.count} {badgeSuffix}
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center">
            <h3 className="text-2xl mb-1 text-slate-900">{searchQuery}</h3>
            <p className="text-base font-semibold text-slate-800">
              {subtitle ?? category.display_name}
            </p>
          </div>
          <ChevronRightIcon className="h-6 w-6 text-slate-600" />
        </div>
      </button>

      {/* Expand/Collapse button */}
      <div className="bg-white">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full px-8 py-4 flex items-center justify-between text-sm border-t border-slate-200/70 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          aria-expanded={isExpanded}
        >
          <span className="ml-auto inline-flex items-center gap-2 text-blue-600 font-medium">
            {isExpanded ? 'Vis færre' : 'Vis flere'}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>

      {/* Expandable content */}
      {visibleResults.length > 0 && (
        <div className="relative p-6 bg-white border-t border-slate-200/70">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600" />
          <div className="space-y-3 pl-3">
            {visibleResults.map((result) => (
              <a
                key={result.id}
                href={`/info/${result.id}?search_id=${searchId ?? ''}`}
                className="group block w-full rounded-xl border px-5 py-4 transition border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                <CategoryResultItem
                  result={result}
                  searchId={searchId}
                  variant={variant}
                />
              </a>
            ))}
          </div>

          {/* "Vis flere (n til)" button */}
          {isExpanded && category.count > (category.results?.length ?? 0) && (
            <div className="mt-5 text-center">
              <Button variant="tertiary" data-size="sm" onClick={navigateToCategory}>
                Vis flere ({category.count - (category.results?.length ?? 0)} til)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
