import { useMemo } from 'react'
import type { ContentDetail, ContentLink, LinkedContentGroup } from '../../../types/content'
import { SEARCH_MAIN_CATEGORIES } from '../../../constants/categories'
import { TemasideHeader } from './TemasideHeader'
import { ContentSection } from './TemasideContentSection'
import { ChildTemasideSection } from './TemasideChildSection'

interface TemasideContentDisplayProps {
  content: ContentDetail
}

const EMPTY_LINKED_CONTENT: readonly LinkedContentGroup[] = []

/** Flat priority index for every subcategory – lower = shown first. */
const INFO_TYPE_PRIORITY: Record<string, number> = Object.fromEntries(
  SEARCH_MAIN_CATEGORIES.flatMap((cat, catIndex) =>
    cat.subcategoryIds.map((subId, subIndex) => [subId, catIndex * 100 + subIndex]),
  ),
)

function sortGroupsByPriority(groups: readonly LinkedContentGroup[]): LinkedContentGroup[] {
  const fallback = SEARCH_MAIN_CATEGORIES.length * 100
  return [...groups].sort((a, b) => {
    const aPriority = INFO_TYPE_PRIORITY[a.info_type] ?? fallback
    const bPriority = INFO_TYPE_PRIORITY[b.info_type] ?? fallback
    return aPriority - bPriority
  })
}

function getParentLink(content: ContentDetail) {
  return content.links?.find((l) => l.rel === 'forelder') ?? null
}

function getChildTemasideLinks(content: ContentDetail): ContentLink[] {
  return (content.links ?? []).filter(
    (l) => l.rel === 'barn' && l.type === 'temaside' && l.href,
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
  const groups = useMemo(
    () => sortGroupsByPriority(content.linked_content ?? EMPTY_LINKED_CONTENT),
    [content.linked_content],
  )
  const parentLabel = parentLink?.title ?? null
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
