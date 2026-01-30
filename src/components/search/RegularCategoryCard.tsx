import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@navikt/aksel-icons';
import type { CategoryGroup } from '../../api/categorized';
import { CategoryResultItem } from './CategoryResultItem';

export interface RegularCategoryCardProps {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
}

export function RegularCategoryCard({ category, searchQuery, searchId }: RegularCategoryCardProps) {
  const navigate = useNavigate();

  const navigateToCategory = () => {
    if (!searchId) return;
    navigate(
      `/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
        category.category
      )}&search_id=${searchId}`
    );
  };

  const items = (category.results ?? []).slice(0, 3);

  return (
    <div
      className="p-0 overflow-hidden rounded-2xl transition-shadow border-2 border-slate-400/80 ring-1 ring-slate-300/50 bg-white"
      style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
    >
      <button
        type="button"
        onClick={navigateToCategory}
        className="relative block w-full text-left px-8 py-7 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 bg-white hover:bg-slate-50 border-b-2 border-slate-200"
      >
        <div className="absolute left-6 top-4">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-200/80 text-slate-700">
            {category.count} treff
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center">
            <h3 className="text-2xl mb-1 font-medium text-slate-900">{category.display_name}</h3>
          </div>
          <ChevronRightIcon className="h-6 w-6 text-slate-600" />
        </div>
      </button>

      <div className="p-6 bg-white">
        <div className="bg-slate-50 border border-slate-300/70 rounded-xl p-4 sm:p-5">
          <div className="space-y-3">
            {items.map((result) => (
              <a
                key={result.id}
                href={`/info/${result.id}?search_id=${searchId ?? ''}`}
                className="group block w-full rounded-xl px-5 py-4 transition bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                <CategoryResultItem result={result} searchId={searchId} variant="regular" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
