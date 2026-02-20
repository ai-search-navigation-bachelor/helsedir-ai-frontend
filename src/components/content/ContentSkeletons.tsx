import { Skeleton } from '@digdir/designsystemet-react'

function HeaderSkeleton() {
  return (
    <header className="space-y-3">
      <Skeleton width={132} height={30} className="rounded-full" />
      <div className="space-y-2">
        <Skeleton variant="text" width={28} />
        <Skeleton variant="text" width={22} />
      </div>
    </header>
  )
}

export function ContentSidebarLoadingSkeleton({ items = 7 }: { items?: number }) {
  return (
    <nav aria-hidden="true">
      <ul className="m-0 list-none border-t border-slate-200 p-0">
        {Array.from({ length: items }).map((_, index) => (
          <li key={`sidebar-skeleton-${index}`} className="border-b border-slate-200 py-3">
            <Skeleton variant="text" width={index % 3 === 0 ? 18 : 22} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ContentBodyLoadingSkeleton({ blocks = 4 }: { blocks?: number }) {
  return (
    <div className="space-y-10" aria-hidden="true">
      {Array.from({ length: blocks }).map((_, blockIndex) => (
        <section key={`content-block-${blockIndex}`} className="space-y-4">
          <Skeleton variant="text" width={blockIndex % 2 === 0 ? 24 : 30} />
          <div className="space-y-2.5">
            <Skeleton variant="text" width={80} />
            <Skeleton variant="text" width={76} />
            <Skeleton variant="text" width={78} />
            <Skeleton variant="text" width={74} />
            <Skeleton variant="text" width={68} />
            <Skeleton variant="text" width={72} />
            <Skeleton variant="text" width={70} />
            <Skeleton variant="text" width={blockIndex % 2 === 0 ? 52 : 58} />
          </div>
        </section>
      ))}
    </div>
  )
}

export function ContentPageLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-label="Laster innhold" aria-busy="true">
      <HeaderSkeleton />

      <div className="grid gap-8 lg:grid-cols-[minmax(230px,270px)_1fr]">
        <aside className="border-slate-200 lg:border-r lg:pr-6">
          <ContentSidebarLoadingSkeleton />
        </aside>

        <section className="min-w-0">
          <ContentBodyLoadingSkeleton />
        </section>
      </div>
    </div>
  )
}

export function DetailAsideLoadingSkeleton() {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-hidden="true">
      <div className="space-y-3">
        <Skeleton variant="text" width={12} />
        <Skeleton variant="text" width={20} />
        <Skeleton variant="text" width={16} />
      </div>
    </section>
  )
}

export function ExpandableLoadingSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="mt-4 border-t border-slate-100" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`expandable-skeleton-${index}`} className="border-b border-slate-100 py-4 px-1">
          <div className="flex items-start gap-3">
            <Skeleton width={16} height={16} className="mt-0.5 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <Skeleton variant="text" width={index % 2 === 0 ? 70 : 85} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function GenericChaptersLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <section
          key={`chapter-skeleton-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="space-y-3">
            <Skeleton variant="text" width={18} />
            <Skeleton variant="text" width={30} />
            <Skeleton variant="text" width={27} />
          </div>
        </section>
      ))}
    </div>
  )
}

export function TemasideHubLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <header className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm px-6 py-6 mb-6">
        <div className="flex items-center gap-4">
          <Skeleton width={64} height={64} className="shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton variant="text" width={28} />
            <Skeleton variant="text" width={40} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton width="100%" height={40} className="rounded-full md:max-w-md" style={{ maxWidth: 448 }} />
          <Skeleton width={160} height={14} className="rounded" />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, colIndex) => (
          <div key={`hub-col-skeleton-${colIndex}`}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-1">
              <Skeleton width={colIndex % 2 === 0 ? 180 : 220} height={16} className="rounded" />
              <Skeleton width={20} height={14} className="rounded" />
            </div>
            <ul className="m-0 list-none p-0">
              {Array.from({ length: 6 }).map((_, itemIndex) => (
                <li key={`hub-item-skeleton-${colIndex}-${itemIndex}`} className="py-3 px-1">
                  <Skeleton variant="text" width={itemIndex % 3 === 0 ? 55 : itemIndex % 3 === 1 ? 70 : 85} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TemasideLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <header className="pb-1">
        <Skeleton width={100} height={14} className="mb-2 rounded" />
        <Skeleton variant="text" width={20} />
      </header>

      <Skeleton width={160} height={14} className="rounded" />

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={`temaside-section-skeleton-${sectionIndex}`}>
          <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-3">
            <Skeleton width={28} height={28} className="shrink-0 rounded-lg" />
            <Skeleton width={sectionIndex % 2 === 0 ? 140 : 180} height={14} className="rounded" />
          </div>
          <ul className="m-0 list-none p-0 py-1">
            {Array.from({ length: sectionIndex === 0 ? 2 : 3 }).map((_, itemIndex) => (
              <li key={`temaside-item-skeleton-${sectionIndex}-${itemIndex}`} className="px-5 py-3.5">
                <Skeleton variant="text" width={itemIndex % 2 === 0 ? 65 : 80} />
                <Skeleton width={90} height={12} className="mt-1 rounded" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

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

export function TableOfContentsLoadingSkeleton() {
  return (
    <nav className="sticky top-4 p-4 bg-[#f9f9f9] rounded border border-[#e0e0e0]" aria-hidden="true">
      <div className="mb-3">
        <Skeleton variant="text" width={9} />
      </div>
      <ul className="list-none p-0 m-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={`toc-skeleton-${index}`} className="mb-2">
            <div className="py-3">
              <Skeleton variant="text" width={index % 2 === 0 ? 22 : 18} />
            </div>
          </li>
        ))}
      </ul>
    </nav>
  )
}
