import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight, HiChevronDown, HiChevronUp } from 'react-icons/hi2'
import type { ContentDetail, ContentLink, LinkedContentGroup, LinkedContentItem } from '../../../types/content'
import { toContentTypeLabel } from '../../../constants/content'
import { buildContentUrl } from '../../../lib/contentUrl'
import { getTemasideCategoryVisual } from './temasideCategoryVisuals'
import { TintableSvgIcon } from './TintableSvgIcon'

interface TemasideContentDisplayProps {
  content: ContentDetail
}

const EMPTY_LINKED_CONTENT: readonly LinkedContentGroup[] = []
const DEFAULT_VISIBLE_ITEMS = 5

function getParentLink(content: ContentDetail) {
  return content.links?.find((l) => l.rel === 'forelder') ?? null
}

function getChildTemasideLinks(content: ContentDetail): ContentLink[] {
  return (content.links ?? []).filter(
    (l) => l.rel === 'barn' && l.type === 'temaside' && l.href,
  )
}

function titleFromPath(path: string): string {
  const slug = path.split('/').filter(Boolean).pop() ?? ''
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

function TemasideHeader({ title, parentLabel }: { title: string; parentLabel?: string | null }) {
  return (
    <header className="pb-1">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#025169' }}>
        Temaside{parentLabel ? ` · ${parentLabel}` : ''}
      </p>
      <h1 className="text-3xl font-bold text-gray-900 leading-tight font-title">{title}</h1>
    </header>
  )
}


function ContentRow({
  item,
  sourceTemasideId,
  sourceTemasideTitle,
}: {
  item: LinkedContentItem
  sourceTemasideId: string
  sourceTemasideTitle: string
}) {
  return (
    <li className="border-b border-gray-100 last:border-0">
      <Link
        to={buildContentUrl(item)}
        state={{
          contentType: item.info_type,
          sourceTemasideId,
          sourceContentId: item.id,
          sourceContentTitle: sourceTemasideTitle,
        }}
        className="group flex items-center justify-between gap-4 px-5 py-3.5 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50 rounded-xl"
      >
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: '#025169' }}>
            {item.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{toContentTypeLabel(item.info_type)}</p>
        </div>
        <HiArrowRight
          size={15}
          className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
          style={{ color: '#025169' }}
        />
      </Link>
    </li>
  )
}

function SectionIcon({ infoType }: { infoType: string }) {
  const visual = getTemasideCategoryVisual(infoType)
  return (
    <span
      className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
      style={{ backgroundColor: '#E8F4F8', color: '#025169' }}
    >
      {visual.icon.kind === 'asset' ? (
        <TintableSvgIcon
          src={visual.icon.src}
          alt={visual.icon.alt}
          className="flex items-center justify-center w-[65%] h-[65%]"
        />
      ) : (
        <visual.icon.component />
      )}
    </span>
  )
}

function ContentSection({
  group,
  sourceTemasideId,
  sourceTemasideTitle,
}: {
  group: LinkedContentGroup
  sourceTemasideId: string
  sourceTemasideTitle: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasHiddenItems = group.items.length > DEFAULT_VISIBLE_ITEMS
  const visibleItems =
    hasHiddenItems && !isExpanded ? group.items.slice(0, DEFAULT_VISIBLE_ITEMS) : group.items
  const hiddenCount = group.items.length - DEFAULT_VISIBLE_ITEMS

  return (
    <section>
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <SectionIcon infoType={group.info_type} />
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide font-title">
            {group.display_name}
          </h2>
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums">{group.items.length}</span>
      </div>

      <ul className="py-1">
        {visibleItems.map((item) => (
          <ContentRow
            key={item.id}
            item={item}
            sourceTemasideId={sourceTemasideId}
            sourceTemasideTitle={sourceTemasideTitle}
          />
        ))}
      </ul>

      {hasHiddenItems && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 mb-2 text-sm font-medium text-gray-400 hover:text-[#025169] transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          {isExpanded ? (
            <><HiChevronUp size={14} /> Vis færre</>
          ) : (
            <><HiChevronDown size={14} /> Vis {hiddenCount} flere</>
          )}
        </button>
      )}
    </section>
  )
}

function ChildTemasideSection({ links }: { links: ContentLink[] }) {
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
        <p className="py-4 text-sm text-gray-400">Ingen undertema matcher "{query}"</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-2 py-1">
          {filtered.map((link) => (
            <li key={link.href} className="border-b border-gray-100">
              <Link
                to={link.href!}
                className="group flex items-center justify-between gap-3 py-3 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50/60"
              >
                <p className="min-w-0 text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: '#025169' }}>
                  {link.tittel || titleFromPath(link.href!)}
                </p>
                <HiArrowRight
                  size={14}
                  className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
                  style={{ color: '#025169' }}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm py-14 text-center">
      <p className="text-sm text-gray-400">
        Det er foreløpig ikke registrert noe innhold under dette temaet.
      </p>
    </div>
  )
}

export function TemasideContentDisplay({ content }: TemasideContentDisplayProps) {
  const parentLink = useMemo(() => getParentLink(content), [content])
  const childTemasideLinks = useMemo(() => getChildTemasideLinks(content), [content])
  const groups = content.linked_content ?? EMPTY_LINKED_CONTENT
  const parentLabel = parentLink?.tittel ?? null
  const hasContent = groups.length > 0 || childTemasideLinks.length > 0

  return (
    <div className="flex flex-col gap-5">
      <TemasideHeader title={content.title} parentLabel={parentLabel} />

      {!hasContent ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-5">
          {childTemasideLinks.length > 0 && (
            <ChildTemasideSection links={childTemasideLinks} />
          )}
          {groups.map((group, groupIndex) => (
            <ContentSection
              key={`${content.id}-${group.info_type}-${group.display_name}-${groupIndex}`}
              group={group}
              sourceTemasideId={content.id}
              sourceTemasideTitle={content.title}
            />
          ))}
        </div>
      )}
    </div>
  )
}
