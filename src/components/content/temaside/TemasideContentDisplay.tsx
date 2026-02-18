import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import {
  IoListOutline,
  IoChevronForward,
  IoChevronDown,
  IoChevronUp,
} from 'react-icons/io5'
import type { ContentDetail, LinkedContentGroup, LinkedContentItem } from '../../../types/content'
import { toContentTypeLabel } from '../../../constants/content'
import type { TemasideCategoryVisual } from './temasideCategoryVisuals'
import { getTemasideCategoryVisual } from './temasideCategoryVisuals'
import { TintableSvgIcon } from './TintableSvgIcon'

interface TemasideContentDisplayProps {
  content: ContentDetail
}

const EMPTY_LINKED_CONTENT: readonly LinkedContentGroup[] = []
const DEFAULT_VISIBLE_ITEMS = 3

function getParentLink(content: ContentDetail) {
  return content.links?.find((l) => l.rel === 'forelder') ?? null
}

function renderTemasideIcon(visual: TemasideCategoryVisual, iconClassName: string) {
  if (visual.icon.kind === 'asset') {
    return <TintableSvgIcon src={visual.icon.src} alt={visual.icon.alt} className={iconClassName} />
  }

  const IconComponent = visual.icon.component
  return <IconComponent />
}

function iconContainerStyle(visual: TemasideCategoryVisual) {
  return {
    backgroundColor: visual.colors.iconBg,
    borderColor: visual.colors.border,
    color: visual.colors.icon,
  }
}

function TemasideHero({ title, parentLabel }: { title: string; parentLabel?: string | null }) {
  return (
    <header className="bg-gradient-to-br from-sky-100 via-[#f0f9ff] to-white rounded-2xl p-10 border border-sky-200">
      <div className="max-w-[42rem]">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            Temaside
          </span>
        </div>
        {parentLabel && (
          <span className="inline-block text-[0.8125rem] font-semibold uppercase tracking-[0.05em] text-[#0369a1] mb-2">
            {parentLabel}
          </span>
        )}
        <Heading level={1} data-size="xl" className="text-[#0c4a6e] mb-3!">
          {title}
        </Heading>
        <Paragraph data-size="md" className="text-[#475569] leading-[1.6] m-0">
          Oversikt over nasjonale faglige anbefalinger, retningslinjer og annet innhold knyttet til
          dette temaet.
        </Paragraph>
      </div>
    </header>
  )
}

function LinkedContentCard({
  item,
  sourceTemasideId,
  sourceTemasideTitle,
}: {
  item: LinkedContentItem
  sourceTemasideId: string
  sourceTemasideTitle: string
}) {
  const visual = getTemasideCategoryVisual(item.info_type)

  return (
    <Link
      to={`/content/${item.id}`}
      state={{
        contentType: item.info_type,
        sourceTemasideId,
        sourceContentId: item.id,
        sourceContentTitle: sourceTemasideTitle,
      }}
      className="group flex items-center gap-4 p-4 px-5 bg-white border border-[#e2e8f0] rounded-xl no-underline text-inherit transition-all hover:border-[#93c5fd] hover:bg-[#f8fafc] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-[#0ea5e9] focus-visible:outline-offset-2"
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-[0.625rem] border border-transparent bg-[#f1f5f9] text-lg shrink-0 transition-all" style={iconContainerStyle(visual)}>
        {renderTemasideIcon(visual, 'flex items-center justify-center w-[72%] h-[72%]')}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-[0.9375rem] font-semibold text-[#1e293b] leading-[1.4] transition-colors group-hover:text-[#0369a1]">{item.title}</span>
        <span className="text-xs font-medium uppercase tracking-[0.03em]" style={{ color: visual.colors.tag }}>
          {toContentTypeLabel(item.info_type)}
        </span>
      </span>
      <IoChevronForward className="text-base text-[#94a3b8] shrink-0 transition-all group-hover:text-[#0369a1] group-hover:translate-x-0.5" />
    </Link>
  )
}

function LinkedContentSection({
  group,
  sourceTemasideId,
  sourceTemasideTitle,
}: {
  group: LinkedContentGroup
  sourceTemasideId: string
  sourceTemasideTitle: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visual = getTemasideCategoryVisual(group.info_type)
  const hasHiddenItems = group.items.length > DEFAULT_VISIBLE_ITEMS
  const visibleItems = hasHiddenItems && !isExpanded
    ? group.items.slice(0, DEFAULT_VISIBLE_ITEMS)
    : group.items
  const hiddenCount = group.items.length - DEFAULT_VISIBLE_ITEMS

  return (
    <section className="[&:not(:first-child)]:border-t [&:not(:first-child)]:border-[#e2e8f0] [&:not(:first-child)]:pt-7">
      <div className="flex items-center gap-[0.625rem] pb-3 mb-4 border-b-2" style={{ borderColor: visual.colors.border }}>
        <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-transparent text-[1.1rem] shrink-0" style={iconContainerStyle(visual)}>
          {renderTemasideIcon(visual, 'flex items-center justify-center w-[78%] h-[78%]')}
        </span>
        <Heading level={2} data-size="sm" className="flex-1 m-0!">
          {group.display_name}
        </Heading>
        <span
          className="inline-flex items-center justify-center min-w-[1.625rem] h-[1.625rem] px-2 rounded-full text-xs font-bold"
          style={{ backgroundColor: visual.colors.iconBg, color: visual.colors.tag }}
        >
          {group.items.length}
        </span>
      </div>
      <div>
        <div className="flex flex-col gap-2">
          {visibleItems.map((item) => (
            <LinkedContentCard
              key={item.id}
              item={item}
              sourceTemasideId={sourceTemasideId}
              sourceTemasideTitle={sourceTemasideTitle}
            />
          ))}
        </div>
        {hasHiddenItems && (
          <div className="mt-2 pt-1 flex justify-center">
            <button
              type="button"
              className="group w-fit inline-flex items-center justify-center gap-2 border border-[#c7d9ef] bg-[#f2f8ff] text-[#1f3550] rounded-full px-4 py-[0.6rem] text-sm font-semibold cursor-pointer shadow-sm transition-all hover:border-[#9fbde1] hover:bg-[#eaf3ff] hover:shadow-md active:bg-[#e4efff] active:border-[#8fb2dc] focus-visible:outline-2 focus-visible:outline-[#0ea5e9] focus-visible:outline-offset-2 aria-expanded:bg-[#eaf3ff] aria-expanded:border-[#9fbde1]"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={isExpanded
                ? `Vis færre sider i ${group.display_name}`
                : `Vis ${hiddenCount} flere sider i ${group.display_name}`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dbeafe] text-[#1e3a5f] text-[0.85rem] group-hover:bg-[#bfdbfe]" aria-hidden="true">
                {isExpanded ? <IoChevronUp /> : <IoChevronDown />}
              </span>
              <span>
                {isExpanded
                  ? `Vis færre i ${group.display_name}`
                  : `Vis ${hiddenCount} flere i ${group.display_name}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyTemasideState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 px-6 text-center text-[#94a3b8]">
      <IoListOutline className="text-[2.5rem] text-[#cbd5e1]" />
      <Paragraph data-size="md">
        Det er foreløpig ikke registrert noe innhold under dette temaet.
      </Paragraph>
    </div>
  )
}

export function TemasideContentDisplay({ content }: TemasideContentDisplayProps) {
  const parentLink = useMemo(() => getParentLink(content), [content])
  const groups = content.linked_content ?? EMPTY_LINKED_CONTENT
  const totalItems = useMemo(() => groups.reduce((sum, g) => sum + g.items.length, 0), [groups])

  const parentLabel = parentLink?.tittel ?? null

  return (
    <div className="flex flex-col gap-8">
      <TemasideHero title={content.title} parentLabel={parentLabel} />

      {totalItems > 0 && (
        <div className="flex flex-wrap gap-[0.625rem]">
          <span className="inline-flex items-center gap-[0.375rem] px-[0.875rem] py-[0.375rem] rounded-full text-[0.8125rem] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            {totalItems} {totalItems === 1 ? 'publikasjon' : 'publikasjoner'}
          </span>
          <span className="inline-flex items-center gap-[0.375rem] px-[0.875rem] py-[0.375rem] rounded-full text-[0.8125rem] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            {groups.length} {groups.length === 1 ? 'kategori' : 'kategorier'}
          </span>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyTemasideState />
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((group, groupIndex) => (
            <LinkedContentSection
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
