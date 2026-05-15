/** Loading skeleton placeholders for search result cards while a search is in progress. */
import { Skeleton } from '@digdir/designsystemet-react'

const badgeWidths = [50, 70, 110, 42, 65]
const titleWidths = ['85%', '60%', '95%', '45%', '75%']
const showDescription = [true, false, true, false, true]
const descWidths = ['90%', '', '70%', '', '80%']

export function SearchResultsLoadingSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={`search-skeleton-${i}`}
          className="bg-white border-l-[3px] px-5 py-4 rounded-xl ring-1 ring-gray-100 shadow-sm"
          style={{ borderLeftColor: '#c8dce2' }}
        >
          {/* Category badge */}
          <div className="mb-2">
            <Skeleton
              width={badgeWidths[i % badgeWidths.length]}
              height={22}
              className="rounded-full"
            />
          </div>

          {/* Title */}
          <Skeleton
            variant="text"
            width={titleWidths[i % titleWidths.length]}
            height={20}
            className="mb-1"
          />

          {/* Description (some cards have it, some don't) */}
          {showDescription[i % showDescription.length] && (
            <Skeleton
              variant="text"
              width={descWidths[i % descWidths.length]}
              height={16}
              className="mt-1"
            />
          )}
        </div>
      ))}
    </div>
  )
}

const tabWidths = [55, 85, 105, 80, 80, 75, 105, 130]

export function SearchPageLoadingSkeleton() {
  return (
    <div aria-label="Laster søkeresultater" aria-busy="true">
      {/* Tab bar */}
      <div className="mb-5 border-b border-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 -mb-px">
          {tabWidths.map((width, i) => (
            <div key={`tab-skeleton-${i}`} className="px-1.5 pt-2 pb-3">
              <Skeleton width={width} height={18} className="rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-3">
        <Skeleton width={180} height={16} className="rounded" />
      </div>

      <SearchResultsLoadingSkeleton />
    </div>
  )
}
