/**
 * Derives a deduplicated, ordered list of chapter entries from a content node's links.
 *
 * Multiple links in the API response can reference the same child document
 * (e.g. once with metadata and once as a bare href). This hook merges those
 * duplicates, keeping the richest available data for each entry, so
 * HierarchicalContentDisplay always has a clean, non-redundant chapter list.
 */
import { useMemo } from 'react'
import type { ContentLink, NestedContent } from '../../types'
import { getContentIdFromHref, getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function getCanonicalContentLinkId(link: Pick<ContentLink, 'id' | 'href'>) {
  return link.id || getContentIdFromHref(link.href) || link.href || ''
}

function getContentLinkRichness(link: ContentLink) {
  let score = 0

  if ((link.children?.length ?? 0) > 0) score += 3
  if (link.path) score += 2
  if (link.last_reviewed_date) score += 1
  if (link.title) score += 1
  if (link.type) score += 1

  return score
}

function mergeContentLinks(current: ContentLink, incoming: ContentLink): ContentLink {
  const winner = getContentLinkRichness(incoming) > getContentLinkRichness(current) ? incoming : current
  const loser = winner === incoming ? current : incoming
  const mergedChildren = getUniqueNestedChildLinks([
    ...(winner.children ?? []),
    ...(loser.children ?? []),
  ])

  return {
    ...loser,
    ...winner,
    id: winner.id || loser.id,
    href: winner.href || loser.href,
    title: winner.title || loser.title,
    type: winner.type || loser.type,
    path: winner.path || loser.path,
    last_reviewed_date: winner.last_reviewed_date || loser.last_reviewed_date,
    tags: winner.tags?.length ? winner.tags : loser.tags,
    strukturId: winner.strukturId || loser.strukturId,
    ...(mergedChildren.length > 0 ? { children: mergedChildren } : {}),
  }
}

function getUniqueNestedChildLinks(links?: ContentLink[] | null) {
  const deduped = new Map<string, ContentLink>()

  for (const link of links ?? []) {
    const key = getCanonicalContentLinkId(link)
    if (!key) continue

    const existing = deduped.get(key)
    deduped.set(key, existing ? mergeContentLinks(existing, link) : link)
  }

  return Array.from(deduped.values())
}

function contentLinkToStub(link: ContentLink): NestedContent {
  const children = getUniqueNestedChildLinks(link.children)
    .filter((c) => Boolean(c.id || c.href))
    .map(contentLinkToStub)

  return {
    id: getCanonicalContentLinkId(link),
    tittel: link.title,
    title: link.title,
    type: link.type,
    ...(children.length > 0 ? { children } : {}),
  }
}

export function useHierarchicalChapters({
  links,
}: UseHierarchicalChaptersOptions) {
  const childrenLinks = useMemo(() => getUniqueChildLinks<ContentLink>(links), [links])

  const entries: ChapterEntry[] = useMemo(
    () => childrenLinks.map((link, index) => ({ index, link, chapter: contentLinkToStub(link) })),
    [childrenLinks],
  )

  return {
    childrenLinks,
    entries,
    loadedChapters: entries,
    failedEntries: [] as ChapterEntry[],
    isChaptersLoading: false,
  }
}
