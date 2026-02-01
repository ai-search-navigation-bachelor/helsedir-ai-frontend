import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@navikt/aksel-icons'
import { Heading, Link } from '@digdir/designsystemet-react'
import type { CategoryGroup } from '../../api/categorized'

export interface RegularCategoryCardProps {
  category: CategoryGroup
  searchQuery: string
  searchId?: string
}

export function RegularCategoryCard({ category, searchQuery, searchId }: RegularCategoryCardProps) {
  const navigate = useNavigate()

  const navigateToCategory = () => {
    if (!searchId) return
    navigate(
      `/category/${encodeURIComponent(category.category)}?query=${encodeURIComponent(searchQuery)}`
    )
  }

  const items = (category.results ?? []).slice(0, 3)

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
      {/* Category name and count */}
      <button
        onClick={navigateToCategory}
        className="flex items-center justify-between w-full group px-4 py-4 bg-slate-50 hover:bg-blue-50 border-b border-slate-200 hover:border-blue-300 transition-all"
      >
        <div className="text-left">
          <Heading level={2} data-size="sm" style={{ margin: 0 }} className="group-hover:text-blue-600 transition-colors">
            {category.display_name} ({category.count})
          </Heading>
        </div>
        <ArrowRightIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </button>

      <div className="p-5">
        {/* Top 3 label */}
        <div className="text-sm text-slate-500 font-medium mb-3">
          Topp 3
        </div>

        {/* List of results */}
        <div className="space-y-3">
          {items.map((result) => (
            <Link
              key={result.id}
              href={`/content/${result.id}`}
              className="block p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all no-underline"
              style={{ textDecoration: 'none' }}
            >
              <div className="font-medium text-slate-900 mb-1">
                {result.title}
              </div>
              <div className="text-sm text-slate-500">
                Hentet fra: {category.display_name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
