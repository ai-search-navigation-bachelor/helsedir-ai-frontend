import { Skeleton } from '@digdir/designsystemet-react'

export function SearchResultsLoadingSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={`search-skeleton-${index}`}
          className="rounded-xl border border-slate-200 bg-white py-4 px-5 shadow-sm"
          style={{ borderLeft: '3px solid #cbd5e1' }}
        >
          <Skeleton width={index % 2 === 0 ? 80 : 100} height={20} className="mb-3 rounded-full" />
          <Skeleton variant="text" width={index % 3 === 0 ? 60 : 75} />
          <Skeleton variant="text" width={index % 2 === 0 ? 85 : 70} />
        </div>
      ))}
    </div>
  )
}

export function SearchPageLoadingSkeleton() {
  return (
    <div aria-label="Laster søkeresultater" aria-busy="true">
      <div className="mb-6 flex gap-4 border-b border-slate-200 pb-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`tab-skeleton-${index}`}
            width={index === 0 ? 40 : 90 + index * 10}
            height={32}
            className="rounded"
          />
        ))}
      </div>
      <SearchResultsLoadingSkeleton />
    </div>
  )
}
