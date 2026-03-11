import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight, HiChevronDown, HiChevronUp } from 'react-icons/hi2'
import type { LinkedContentGroup, LinkedContentItem } from '../../../types/content'
import { toContentTypeLabel } from '../../../constants/content'
import { normalizeContentType } from '../../../constants/content'
import { buildContentUrl } from '../../../lib/contentUrl'
import { ds } from '../../../styles/dsTokens'
import { getTemasideCategoryVisual } from './temasideCategoryVisuals'
import { TintableSvgIcon } from './TintableSvgIcon'
import { RetningslinjeChapters } from './RetningslinjeChapters'

export const DEFAULT_VISIBLE_ITEMS = 5

const brandColor = ds.color('logobla-1', 'base-default')
const brandSurfaceTinted = ds.color('logobla-1', 'surface-tinted')

export function SectionIcon({ infoType }: { infoType: string }) {
  const visual = getTemasideCategoryVisual(infoType)
  return (
    <span
      className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
      style={{ backgroundColor: brandSurfaceTinted, color: brandColor }}
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

const isRetningslinje = (infoType: string) =>
  normalizeContentType(infoType) === 'retningslinje'

function getLinkedContentHref(item: LinkedContentItem) {
  const documentUrl = item.document_url?.trim()
  if (item.is_pdf_only && documentUrl) {
    return documentUrl
  }

  return buildContentUrl(item)
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
  const showChapters = isRetningslinje(item.info_type)
  const href = getLinkedContentHref(item)
  const isPdfOnly = Boolean(item.is_pdf_only && item.document_url?.trim())

  return (
    <li className="border-b border-gray-100 last:border-0">
      {isPdfOnly ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 px-5 py-3.5 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50 rounded-xl"
        >
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: brandColor }}>
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">PDF</p>
          </div>
          <HiArrowRight
            size={15}
            className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
            style={{ color: brandColor }}
          />
        </a>
      ) : (
        <Link
          to={href}
          state={{
            contentType: item.info_type,
            sourceTemasideId,
            sourceContentId: item.id,
            sourceContentTitle: sourceTemasideTitle,
          }}
          className="group flex items-center justify-between gap-4 px-5 py-3.5 no-underline text-inherit transition-colors duration-100 hover:bg-gray-50 rounded-xl"
        >
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium leading-snug transition-colors" style={{ color: brandColor }}>
              {item.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{toContentTypeLabel(item.info_type)}</p>
          </div>
          <HiArrowRight
            size={15}
            className="flex-shrink-0 transition-all duration-150 group-hover:translate-x-1"
            style={{ color: brandColor }}
          />
        </Link>
      )}
      {showChapters && (
        <RetningslinjeChapters
          itemId={item.id}
          itemPath={item.path}
          sourceTemasideId={sourceTemasideId}
          sourceTemasideTitle={sourceTemasideTitle}
        />
      )}
    </li>
  )
}

export function ContentSection({
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
