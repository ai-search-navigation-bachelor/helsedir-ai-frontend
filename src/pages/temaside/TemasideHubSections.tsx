import { Link } from 'react-router-dom'
import { Heading } from '@digdir/designsystemet-react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import type { HubSection } from '../../lib/temaside/hubUtils'

interface TemasideHubSectionsProps {
  hasCustomLayout: boolean
  isFlatStructure: boolean
  onClearQuery: () => void
  onOpenLinkedPath: (path: string) => void
  query: string
  visibleSections: HubSection[]
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
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
        <p className="text-slate-700">Ingen treff for "{query.trim()}".</p>
        <button
          type="button"
          onClick={onClearQuery}
          className="mt-3 text-sm font-semibold text-[#005F73] hover:underline"
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
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <Heading level={2} data-size="md" className="font-bold text-slate-900">
            {primarySection.title}
          </Heading>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {primarySection.links.length}
          </span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2">
          {primarySection.links.map((item) => (
            <li key={item.path} className="border-b border-slate-200 last:border-b-0">
              <Link
                to={item.path}
                onClick={() => onOpenLinkedPath(item.path)}
                className="flex items-start gap-2 px-5 py-3.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#005F73]"
              >
                <ChevronRightIcon
                  className="mt-1 h-4 w-4 flex-shrink-0 text-[#005F73]"
                  aria-hidden
                />
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {visibleSections.map((section) => (
        <section key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <Heading level={2} data-size="md" className="font-bold text-slate-900">
              {section.title}
            </Heading>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {section.links.length}
            </span>
          </div>

          <ul>
            {section.links.map((item) => (
              <li key={item.path} className="border-b border-slate-200 last:border-b-0">
                <Link
                  to={item.path}
                  onClick={() => onOpenLinkedPath(item.path)}
                  className="flex items-start gap-2 px-5 py-3.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#005F73]"
                >
                  <ChevronRightIcon
                    className="mt-1 h-4 w-4 flex-shrink-0 text-[#005F73]"
                    aria-hidden
                  />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
