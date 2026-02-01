import { useState } from 'react'
import { ChevronDownIcon } from '@navikt/aksel-icons'
import { Heading, Link, Button } from '@digdir/designsystemet-react'
import type { CategoryGroup } from '../../api/categorized'

type Variant = 'temaside' | 'retningslinje'

export interface ExpandableCategoryCardProps {
  category: CategoryGroup
  searchQuery: string
  searchId?: string
  variant: Variant
  badgeSuffix?: string
  previewCount?: number
  subtitle?: string
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
  const [isExpanded, setIsExpanded] = useState(false)

  const items = category.results ?? []
  const topResult = items[0]
  const remainingItems = items.slice(1)

  if (!topResult) return null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      {/* Category name and count */}
      <div className="mb-4 pb-3 border-b border-slate-200">
        <div className="font-semibold text-slate-900 text-lg mb-1">
          {category.display_name}
        </div>
        <div className="text-sm text-slate-500">
          {category.count} treff
        </div>
      </div>

      {/* Top result - best match */}
      <Link
        href={`/content/${topResult.id}`}
        className="block p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all no-underline mb-4"
        style={{ textDecoration: 'none' }}
      >
        <div className="font-medium text-slate-900 mb-1">
          {topResult.title}
        </div>
        <div className="text-sm text-slate-500">
          Hentet fra: {category.display_name}
        </div>
      </Link>

      {/* Expandable list of remaining results */}
      {isExpanded && remainingItems.length > 0 && (
        <div className="space-y-3 mb-3">
          {remainingItems.map((result) => (
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
      )}

      {/* Show more/less button */}
      {remainingItems.length > 0 && (
        <Button
          variant="tertiary"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ marginTop: isExpanded ? '0' : '12px', padding: 0 }}
          className="text-sm flex items-center gap-2"
        >
          {isExpanded ? 'Vis færre' : `Vis flere (${remainingItems.length})`}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      )}
    </div>
  )
}
