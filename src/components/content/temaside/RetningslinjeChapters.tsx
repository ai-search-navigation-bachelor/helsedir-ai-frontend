import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2'
import { useContentByIdQuery } from '../../../hooks/queries/useContentByIdQuery'
import type { ContentLink } from '../../../types/content'
import { buildContentUrl } from '../../../lib/contentUrl'
import { ds } from '../../../styles/dsTokens'

const DEFAULT_VISIBLE = 3
const brandColor = ds.color('logobla-1', 'base-default')

function getChapterLinks(links: ContentLink[] | undefined): ContentLink[] {
  return (links ?? []).filter(
    (l) => l.rel === 'barn' && l.type === 'kapittel' && l.tittel && (l.id || l.href),
  )
}

export function RetningslinjeChapters({
  itemId,
  itemPath,
  sourceTemasideId,
  sourceTemasideTitle,
}: {
  itemId: string
  itemPath?: string
  sourceTemasideId: string
  sourceTemasideTitle: string
}) {
  const { data } = useContentByIdQuery({ contentId: itemId })
  const parentUrl = buildContentUrl({ id: itemId, path: itemPath })
  const [isExpanded, setIsExpanded] = useState(false)

  const chapters = data ? getChapterLinks(data.links) : []
  if (chapters.length === 0) return null

  const hasHidden = chapters.length > DEFAULT_VISIBLE
  const visible = hasHidden && !isExpanded ? chapters.slice(0, DEFAULT_VISIBLE) : chapters
  const hiddenCount = chapters.length - DEFAULT_VISIBLE

  return (
    <ul className="ml-6 mr-4 mb-2 mt-0.5">
      {visible.map((ch, i) => (
        <li key={ch.id ?? ch.href} className="border-b border-gray-100 last:border-0">
          <Link
            to={parentUrl}
            state={{
              contentType: 'retningslinje',
              sourceTemasideId,
              sourceContentId: itemId,
              sourceContentTitle: sourceTemasideTitle,
              sectionId: ch.id ?? '',
            }}
            className="group flex items-center gap-3 px-4 py-2.5 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50 rounded-lg -mx-1"
          >
            <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
              Kapittel {i + 1}
            </span>
            <span
              className="text-sm leading-snug group-hover:underline transition-colors"
              style={{ color: brandColor }}
            >
              {ch.tittel}
            </span>
          </Link>
        </li>
      ))}
      {hasHidden && (
        <li>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1.5 px-3 mt-0.5 mb-1 text-sm font-medium text-gray-400 hover:text-[#025169] transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            {isExpanded ? (
              <><HiChevronUp size={14} /> Vis færre</>
            ) : (
              <><HiChevronDown size={14} /> Vis {hiddenCount} flere kapitler</>
            )}
          </button>
        </li>
      )}
    </ul>
  )
}
