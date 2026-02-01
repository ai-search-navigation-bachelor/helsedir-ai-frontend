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
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      {/* Category name and count */}
      <div className="mb-4">
        <button
          onClick={navigateToCategory}
          className="flex items-center justify-between w-full group p-3 rounded-lg bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-400 transition-all"
        >
          <Heading level={2} data-size="sm" style={{ margin: 0 }} className="group-hover:text-blue-600 transition-colors">
            {category.display_name}
          </Heading>
          <ArrowRightIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </button>
        <div className="text-sm text-slate-500 mt-2 px-1">
          Topp 3 av {category.count} treff
        </div>
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
  )
}
