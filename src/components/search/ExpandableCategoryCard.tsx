import { useState } from 'react'
import { ChevronDownIcon } from '@navikt/aksel-icons'
import { Link, Button } from '@digdir/designsystemet-react'
import type { CategoryGroup } from '../../types'

export interface ExpandableCategoryCardProps {
  category: CategoryGroup
}

export function ExpandableCategoryCard({
  category,
}: ExpandableCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const items = category.results ?? []
  const topResult = items[0]
  const remainingItems = items.slice(1)

  if (!topResult) return null

  return (
    <div id={`category-${category.category}`} className="mb-6">
      <div className="bg-white border-2 border-slate-300 rounded-lg">
        {/* Category header */}
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="font-semibold text-slate-900 text-lg mb-1">
            {category.display_name}
          </div>
          <div className="text-sm text-slate-500">
            {category.count} treff
          </div>
        </div>

        <div className="px-5 pb-5 pt-3">

          {/* Top result - best match */}
          <Link
            href={`/content/${topResult.id}`}
            className="block py-5 px-5 -mx-5 mb-3 bg-slate-50 hover:bg-blue-100 border-l-4 border-slate-300 hover:border-blue-500 transition-all no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="font-semibold text-slate-900 mb-2 text-lg">
              {topResult.title}
            </div>
            <div className="text-sm text-slate-500">
              Hentet fra ...
            </div>
          </Link>

          {/* Expandable list of remaining results */}
          {isExpanded && remainingItems.length > 0 && (
            <div className="space-y-2 mb-3">
              {remainingItems.map((result) => (
                <Link
                  key={result.id}
                  href={`/content/${result.id}`}
                  className="block p-4 -mx-5 px-5 bg-slate-50 hover:bg-blue-100 border-l-4 border-slate-300 hover:border-blue-500 transition-all no-underline"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="font-semibold text-slate-900 mb-1 text-base">
                    {result.title}
                  </div>
                  <div className="text-sm text-slate-500">
                    Hentet fra ...
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Show more/less button */}
          {remainingItems.length > 0 && (
            <Button
              variant="tertiary"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ marginTop: isExpanded ? '0' : '12px', padding: 0 }}
              className="text-sm flex items-center gap-2"
            >
              {isExpanded ? 'Vis færre' : `Vis resten (${category.count - 1})`}
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
