import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi2'
import type { HubSection } from '../../../lib/temaside/hubUtils'

interface TemasideHubSectionsProps {
  hasCustomLayout: boolean
  isFlatStructure: boolean
  onClearQuery: () => void
  onOpenLinkedPath: (path: string) => void
  query: string
  visibleSections: HubSection[]
}

function SectionLinkItem({
  path,
  title,
  isInactive = false,
  onOpenLinkedPath,
}: {
  path: string
  title: string
  isInactive?: boolean
  onOpenLinkedPath: (path: string) => void
}) {
  if (isInactive) {
    return (
      <li className="border-b border-gray-100 last:border-b-0">
        <div
          title="Denne temasiden har foreløpig ikke innhold"
          aria-disabled="true"
          className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-gray-400 cursor-not-allowed bg-gray-50/60"
        >
          <span>{title}</span>
          <HiArrowRight
            size={14}
            className="flex-shrink-0 text-gray-300"
          />
        </div>
      </li>
    )
  }

  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <Link
        to={path}
        onClick={() => onOpenLinkedPath(path)}
        className="group flex items-center justify-between gap-3 px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-[#e8f4f8] hover:text-[#025169]"
      >
        <span>{title}</span>
        <HiArrowRight
          size={14}
          className="flex-shrink-0 text-gray-300 transition-all group-hover:text-[#025169] group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  )
}

function SectionCard({ title, links, onOpenLinkedPath }: { title: string; links: HubSection['links']; onOpenLinkedPath: (path: string) => void }) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="font-title text-base font-semibold text-gray-900">{title}</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {links.length}
        </span>
      </div>
      <ul>
        {links.map((item) => (
          <SectionLinkItem
            key={item.path}
            path={item.path}
            title={item.title}
            isInactive={item.isInactive}
            onOpenLinkedPath={onOpenLinkedPath}
          />
        ))}
      </ul>
    </section>
  )
}

export function TemasideHubSections({
  hasCustomLayout,
  isFlatStructure,
  onClearQuery,
  onOpenLinkedPath,
  query,
  visibleSections,
}: TemasideHubSectionsProps) {
  if (visibleSections.length === 0) {
    return (
      <div className="rounded-xl bg-white ring-1 ring-gray-100 px-5 py-10 text-center">
        <p className="text-gray-700">Ingen treff for «{query.trim()}».</p>
        <button
          type="button"
          onClick={onClearQuery}
          className="mt-3 text-sm font-semibold text-[#025169] hover:underline"
        >
          Nullstill filter
        </button>
      </div>
    )
  }

  if (isFlatStructure && !hasCustomLayout) {
    const [primarySection] = visibleSections
    if (!primarySection) return null

    return (
      <section className="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-title text-base font-semibold text-gray-900">{primarySection.title}</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {primarySection.links.length}
          </span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2">
          {primarySection.links.map((item) => (
            <SectionLinkItem
              key={item.path}
              path={item.path}
              title={item.title}
              isInactive={item.isInactive}
              onOpenLinkedPath={onOpenLinkedPath}
            />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleSections.map((section) => (
        <SectionCard
          key={section.id}
          title={section.title}
          links={section.links}
          onOpenLinkedPath={onOpenLinkedPath}
        />
      ))}
    </div>
  )
}
