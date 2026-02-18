import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import {
  IoDocumentTextOutline,
  IoGitNetworkOutline,
  IoBookOutline,
  IoShieldCheckmarkOutline,
  IoListOutline,
  IoChevronForward,
} from 'react-icons/io5'
import type { ContentDetail, LinkedContentGroup, LinkedContentItem } from '../../../types/content'
import { toContentTypeLabel } from '../../../constants/content'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TemasideContentDisplayProps {
  content: ContentDetail
}

const EMPTY_LINKED_CONTENT: readonly LinkedContentGroup[] = []

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Pick an icon for a given info_type. */
function infoTypeIcon(infoType: string) {
  switch (infoType) {
    case 'retningslinje':
    case 'nasjonal-faglig-retningslinje':
      return <IoDocumentTextOutline />
    case 'nasjonalt-forlop':
    case 'pakkeforlop':
      return <IoGitNetworkOutline />
    case 'veileder':
      return <IoBookOutline />
    case 'lov':
    case 'forskrift':
    case 'rundskriv':
      return <IoShieldCheckmarkOutline />
    default:
      return <IoListOutline />
  }
}

/** A subtle accent colour per info_type so each section has visual identity. */
function sectionAccent(infoType: string) {
  switch (infoType) {
    case 'retningslinje':
    case 'nasjonal-faglig-retningslinje':
      return { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', tag: '#1e40af' }
    case 'nasjonalt-forlop':
    case 'pakkeforlop':
      return { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', tag: '#166534' }
    case 'veileder':
      return { bg: '#fefce8', border: '#fef08a', icon: '#ca8a04', tag: '#854d0e' }
    case 'lov':
    case 'forskrift':
    case 'rundskriv':
      return { bg: '#fdf4ff', border: '#e9d5ff', icon: '#9333ea', tag: '#6b21a8' }
    default:
      return { bg: '#f8fafc', border: '#e2e8f0', icon: '#475569', tag: '#334155' }
  }
}

/** Get the parent link (forelder) from the content links. */
function getParentLink(content: ContentDetail) {
  return content.links?.find((l) => l.rel === 'forelder') ?? null
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TemasideHero({ title, parentLabel }: { title: string; parentLabel?: string | null }) {
  return (
    <header className="temaside-hero">
      <div className="temaside-hero__inner">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            Temaside
          </span>
        </div>
        {parentLabel && (
          <span className="temaside-hero__parent">{parentLabel}</span>
        )}
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
  const accent = sectionAccent(item.info_type)

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
      <span className="temaside-card__icon" style={{ color: accent.icon }}>
        {infoTypeIcon(item.info_type)}
      </span>
      <span className="temaside-card__body">
        <span className="temaside-card__title">{item.title}</span>
        <span className="temaside-card__type" style={{ color: accent.tag }}>
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
  const accent = sectionAccent(group.info_type)

  return (
    <section className="temaside-section">
      <div className="temaside-section__header" style={{ borderColor: accent.border }}>
        <span className="temaside-section__icon" style={{ color: accent.icon }}>
          {infoTypeIcon(group.info_type)}
        </span>
        <Heading level={2} data-size="sm" className="temaside-section__title">
          {group.display_name}
        </Heading>
        <span className="temaside-section__count">{group.items.length}</span>
      </div>
      <div className="temaside-section__cards">
        {group.items.map((item) => (
          <LinkedContentCard
            key={item.id}
            item={item}
            sourceTemasideId={sourceTemasideId}
            sourceTemasideTitle={sourceTemasideTitle}
          />
        ))}
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

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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
