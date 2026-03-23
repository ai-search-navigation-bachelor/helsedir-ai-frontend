import { useMemo } from 'react'
import type { ContentDetail, ContentLink, LinkedContentGroup } from '../../../types/content'
import { SEARCH_MAIN_CATEGORIES } from '../../../constants/categories'
import { normalizeContentType } from '../../../constants/content'
import { TemasideHeader } from './TemasideHeader'
import { ContentSection } from './TemasideContentSection'
import { ChildTemasideSection } from './TemasideChildSection'
import { buildContentUrl } from '../../../lib/contentUrl'
import { useThemePagesQuery } from '../../../hooks/queries/useThemePagesQuery'
import { normalizeTemasidePath } from '../../../lib/temaside/hubUtils'

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
  return groups
    .filter((group) => Array.isArray(group.items) && group.items.length > 0)
    .sort((a, b) => {
    const aPriority = INFO_TYPE_PRIORITY[a.info_type] ?? fallback
    const bPriority = INFO_TYPE_PRIORITY[b.info_type] ?? fallback
    return aPriority - bPriority
  })
}

function getParentLink(content: ContentDetail) {
  if (content.parent?.id) {
    return {
      rel: 'forelder',
      type: content.parent.content_type || content.parent.info_type || '',
      title: content.parent.title,
      href: content.parent.path
        ? buildContentUrl({ path: content.parent.path, id: content.parent.id })
        : `/content/${content.parent.id}`,
      id: content.parent.id,
      path: content.parent.path || null,
    } satisfies ContentLink
  }

  return content.links?.find((l) => l.rel === 'forelder') ?? null
}

function getTemasideLinkKey(link: ContentLink) {
  return link.id || link.path || link.href || ''
}

function getChildTemasideLinks(
  content: ContentDetail,
  tagsByKey: Map<string, string[]>,
): ContentLink[] {
  const groupedTemasideItems = content.child_groups
    ?.filter((group) => group.info_type === 'temaside')
    .flatMap((group) =>
      group.items
        .filter((item) => item.path || item.id)
        .map((item) => ({
          rel: 'barn',
          type: item.content_type || item.info_type || 'temaside',
          title: item.title,
          tags: item.tags || tagsByKey.get(item.path ? normalizeTemasidePath(item.path) : item.id),
          href: item.path
            ? buildContentUrl({ path: item.path, id: item.id })
            : `/content/${item.id}`,
          id: item.id,
          path: item.path || null,
        })),
    )

  const directTemasideLinks = (content.links ?? [])
    .reduce<ContentLink[]>((result, link) => {
      if (
        link.rel !== 'barn' ||
        normalizeContentType(link.type) !== 'temaside' ||
        (!link.href && !link.path && !link.id)
      ) {
        return result
      }

      const href = link.id ? buildContentUrl({ path: link.path, id: link.id }) : link.href
      if (!href) return result

      result.push({
        ...link,
        href,
        tags: link.tags || tagsByKey.get(link.path ? normalizeTemasidePath(link.path) : (link.id || '')),
        path: link.path || null,
      })
      return result
    }, [])

  const mergedLinks = [...(groupedTemasideItems ?? []), ...directTemasideLinks]
  const seen = new Set<string>()

  return mergedLinks.filter((link) => {
    const key = getTemasideLinkKey(link)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
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
  const { data: themePagesData } = useThemePagesQuery()
  const tagsByKey = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const page of themePagesData?.results ?? []) {
      if (page.info_type !== 'temaside' || !page.tags?.length) continue
      map.set(page.id, page.tags)
      map.set(normalizeTemasidePath(page.path), page.tags)
    }
    return map
  }, [themePagesData])
  const childTemasideLinks = useMemo(() => getChildTemasideLinks(content, tagsByKey), [content, tagsByKey])
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
