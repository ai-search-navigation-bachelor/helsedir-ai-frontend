import { Skeleton } from '@digdir/designsystemet-react'

/** Placeholder for the breadcrumb row so content doesn't jump when it appears. */
export function BreadcrumbLoadingSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        marginBottom: 19.5,
        minHeight: '22px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="text" width={10} style={{ fontSize: '0.9rem', lineHeight: 1.5 }} />
        <Skeleton variant="text" width={14} style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.8 }} />
      </div>
    </div>
  )
}

/** Matches ContentPageHeader: small uppercase label + large title lines. */
function HeaderSkeleton() {
  return (
    <header className="pb-1">
      <div className="mb-2 flex items-center">
        <Skeleton variant="text" style={{ width: 96 }} height={16} className="rounded-sm" />
      </div>
      <div className="space-y-1.5">
        <Skeleton
          variant="text"
          width={72}
          style={{ fontSize: '1.875rem', lineHeight: 1.2, fontWeight: 700 }}
        />
        <Skeleton
          variant="text"
          width={48}
          style={{ fontSize: '1.875rem', lineHeight: 1.2, fontWeight: 700 }}
        />
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
    <div aria-label="Laster innhold" aria-busy="true">
      <BreadcrumbLoadingSkeleton />
      <HeaderSkeleton />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(230px,270px)_1fr]">
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

export function DetailPageLoadingSkeleton() {
  return (
    <div aria-label="Laster innhold" aria-busy="true">
      <BreadcrumbLoadingSkeleton />
      <HeaderSkeleton />

      <section className="mt-8 min-w-0">
        <ContentBodyLoadingSkeleton blocks={3} />
      </section>
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
