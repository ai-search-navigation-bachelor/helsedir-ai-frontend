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

      <div className="grid gap-8 lg:grid-cols-[minmax(290px,360px)_1fr]">
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

export function TableOfContentsLoadingSkeleton() {
  return (
    <nav className="toc" aria-hidden="true">
      <div className="mb-3">
        <Skeleton variant="text" width={9} />
      </div>
      <ul className="toc__list">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={`toc-skeleton-${index}`} className="toc__item">
            <div className="py-3">
              <Skeleton variant="text" width={index % 2 === 0 ? 22 : 18} />
            </div>
          </li>
        ))}
      </ul>
    </nav>
  )
}
