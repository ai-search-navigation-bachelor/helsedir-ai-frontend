import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi2'
import type { ContentLink } from '../../../types/content'
import { ds } from '../../../styles/dsTokens'
import { SectionIcon } from './TemasideContentSection'

const brandColor = ds.color('logobla-1', 'base-default')

function titleFromPath(path: string): string {
  const slug = path.split('/').filter(Boolean).pop() ?? ''
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

export function ChildTemasideSection({ links }: { links: ContentLink[] }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return links
    const q = query.trim().toLowerCase()
    return links.filter((l) => {
      const title = (l.tittel || titleFromPath(l.href!)).toLowerCase()
      return title.includes(q)
    })
  }, [links, query])

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
          {filtered.length === links.length ? links.length : `${filtered.length} / ${links.length}`}
        </span>
      </div>

      {links.length > 6 && (
        <div className="pt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer undertema..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#025169] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#025169]/20 transition-colors"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-4 text-sm text-gray-400">Ingen undertema matcher &quot;{query}&quot;</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-2 py-1">
          {filtered.map((link) => (
            <li key={link.href} className="border-b border-gray-100">
              <Link
                to={link.href!}
                className="group flex items-center justify-between gap-3 py-3 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50/60"
              >
                <p className="min-w-0 text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: brandColor }}>
                  {link.tittel || titleFromPath(link.href!)}
                </p>
                <HiArrowRight
                  size={14}
                  className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
                  style={{ color: brandColor }}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
