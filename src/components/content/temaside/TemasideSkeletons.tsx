/** Loading skeleton placeholders for temaside hub and content pages while data is being fetched. */
import { Skeleton } from '@digdir/designsystemet-react'

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, colIndex) => (
          <div key={`hub-col-skeleton-${colIndex}`} className="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Skeleton width={colIndex % 2 === 0 ? 180 : 220} height={16} className="rounded" />
              <Skeleton width={20} height={20} className="rounded-full" />
            </div>
            <ul className="m-0 list-none p-0">
              {Array.from({ length: colIndex === 1 ? 4 : 5 }).map((_, itemIndex) => (
                <li key={`hub-item-skeleton-${colIndex}-${itemIndex}`} className="flex items-center justify-between border-b border-gray-100 px-5 py-3 last:border-b-0">
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
        <Skeleton variant="text" width={12} style={{ fontSize: '0.75rem', lineHeight: '1rem', marginBottom: 8 }} />
        <div className="space-y-1">
          <Skeleton variant="text" width={50} style={{ fontSize: '1.875rem', lineHeight: 1.2 }} />
        </div>
      </header>

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={`temaside-section-skeleton-${sectionIndex}`}>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <Skeleton width={28} height={28} className="shrink-0 rounded-lg" />
              <Skeleton width={sectionIndex % 2 === 0 ? 140 : 180} height={14} className="rounded" />
            </div>
            <Skeleton width={16} height={14} className="rounded" />
          </div>
          <ul className="m-0 list-none p-0 py-1">
            {Array.from({ length: sectionIndex === 0 ? 3 : 4 }).map((_, itemIndex) => (
              <li key={`temaside-item-skeleton-${sectionIndex}-${itemIndex}`} className="px-5 py-3.5">
                <Skeleton variant="text" width={itemIndex % 2 === 0 ? 65 : 80} />
                <Skeleton width={70} height={12} className="mt-0.5 rounded" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
