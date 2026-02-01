import { ArrowUpIcon } from '@navikt/aksel-icons'
import type { CategoryGroup } from '../../types'

export interface CategorySidebarProps {
  categories: CategoryGroup[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
}

export function CategorySidebar({ categories, activeCategory, onCategoryClick }: CategorySidebarProps) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <aside>
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        {/* Scroll to top button */}
        <button
          onClick={scrollToTop}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          <ArrowUpIcon className="w-4 h-4" />
          <span>Til toppen</span>
        </button>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
          Kategorier
        </h3>
        <nav>
          <ul className="space-y-1">
            {categories.map((category) => {
              const isActive = activeCategory === category.category
              return (
                <li key={category.category}>
                  <button
                    onClick={() => onCategoryClick(category.category)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-all
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{category.display_name}</span>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full flex-shrink-0
                        ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'}
                      `}>
                        {category.count}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
