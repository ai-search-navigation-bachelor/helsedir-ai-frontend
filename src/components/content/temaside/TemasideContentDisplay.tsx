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

function renderTemasideIcon(visual: TemasideCategoryVisual) {
  if (visual.icon.kind === 'asset') {
    return <TintableSvgIcon src={visual.icon.src} alt={visual.icon.alt} className="temaside-icon-image" />
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
    <header className="temaside-hero">
      <div className="temaside-hero__inner">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            Temaside
          </span>
        </div>
        {parentLabel && <span className="temaside-hero__parent">{parentLabel}</span>}
        <Heading level={1} data-size="xl" className="temaside-hero__title">
          {title}
        </Heading>
        <Paragraph data-size="md" className="temaside-hero__subtitle">
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
      className="temaside-card"
    >
      <span className="temaside-card__icon" style={iconContainerStyle(visual)}>
        {renderTemasideIcon(visual)}
      </span>
      <span className="temaside-card__body">
        <span className="temaside-card__title">{item.title}</span>
        <span className="temaside-card__type" style={{ color: visual.colors.tag }}>
          {toContentTypeLabel(item.info_type)}
        </span>
      </span>
      <IoChevronForward className="temaside-card__arrow" />
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
    <section className="temaside-section">
      <div className="temaside-section__header" style={{ borderColor: visual.colors.border }}>
        <span className="temaside-section__icon" style={iconContainerStyle(visual)}>
          {renderTemasideIcon(visual)}
        </span>
        <Heading level={2} data-size="sm" className="temaside-section__title">
          {group.display_name}
        </Heading>
        <span
          className="temaside-section__count"
          style={{ backgroundColor: visual.colors.iconBg, color: visual.colors.tag }}
        >
          {group.items.length}
        </span>
      </div>
      <div className="temaside-section__body">
        <div className="temaside-section__cards">
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
          <div className="temaside-section__footer">
            <button
              type="button"
              className="temaside-section__toggle"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={isExpanded
                ? `Vis færre sider i ${group.display_name}`
                : `Vis ${hiddenCount} flere sider i ${group.display_name}`}
            >
              <span className="temaside-section__toggle-icon" aria-hidden="true">
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
    <div className="temaside-empty">
      <IoListOutline className="temaside-empty__icon" />
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
    <div className="temaside-display">
      <TemasideHero title={content.title} parentLabel={parentLabel} />

      {totalItems > 0 && (
        <div className="temaside-stats">
          <span className="temaside-stats__badge">
            {totalItems} {totalItems === 1 ? 'publikasjon' : 'publikasjoner'}
          </span>
          <span className="temaside-stats__badge">
            {groups.length} {groups.length === 1 ? 'kategori' : 'kategorier'}
          </span>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyTemasideState />
      ) : (
        <div className="temaside-sections">
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
