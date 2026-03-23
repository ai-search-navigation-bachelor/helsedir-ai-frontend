import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi2'
import type { ContentLink } from '../../../types/content'
import { ds } from '../../../styles/dsTokens'
import { SectionIcon } from './TemasideContentSection'
import { isInactiveTemasideNode } from '../../../lib/temaside/visibility'

const brandColor = ds.color('logobla-1', 'base-default')

function titleFromPath(path: string): string {
  const slug = path.split('/').filter(Boolean).pop() ?? ''
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

type LinkWithHref = ContentLink & { href: string }

function hasHref(link: ContentLink): link is LinkWithHref {
  return Boolean(link.href)
}

export function ChildTemasideSection({ links }: { links: ContentLink[] }) {
  const [query, setQuery] = useState('')
  const validLinks = useMemo(() => links.filter(hasHref), [links])
  const filtered = useMemo(() => {
    if (!query.trim()) return validLinks
    const q = query.trim().toLowerCase()
    return validLinks.filter((l) => {
      const title = (l.title || titleFromPath(l.href)).toLowerCase()
      return title.includes(q)
    })
  }, [validLinks, query])

  return (
    <section>
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <SectionIcon infoType="temaside" />
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide font-title">
            Undertema
          </h2>
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums">
          {filtered.length === validLinks.length ? validLinks.length : `${filtered.length} / ${validLinks.length}`}
        </span>
      </div>

      {validLinks.length > 6 && (
        <div className="pt-3">
          <input
            type="search"
            aria-label="Filtrer undertema"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer undertema..."
            style={{
              '--brand-focus': brandColor,
            } as React.CSSProperties}
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[var(--brand-focus)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-focus)]/20 transition-colors"
          />
        </div>
      )}

      {filtered.length === 0 && query.trim() ? (
        <p className="py-4 text-sm text-gray-400">Ingen undertema matcher &quot;{query}&quot;</p>
      ) : filtered.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-2 py-1">
          {filtered.map((link) => (
            <li key={link.href} className="border-b border-gray-100">
              {isInactiveTemasideNode(link) ? (
                <div
                  title="Denne temasiden har foreløpig ikke innhold"
                  aria-disabled="true"
                  className="flex items-center justify-between gap-3 py-3 text-gray-400 cursor-not-allowed"
                >
                  <p className="min-w-0 text-[0.9375rem] font-medium leading-snug">
                    {link.title || titleFromPath(link.href)}
                  </p>
                  <HiArrowRight
                    size={14}
                    className="flex-shrink-0 text-gray-300"
                  />
                </div>
              ) : (
                <Link
                  to={link.href}
                  className="group flex items-center justify-between gap-3 py-3 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50/60"
                >
                  <p className="min-w-0 text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: brandColor }}>
                    {link.title || titleFromPath(link.href)}
                  </p>
                  <HiArrowRight
                    size={14}
                    className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
                    style={{ color: brandColor }}
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
