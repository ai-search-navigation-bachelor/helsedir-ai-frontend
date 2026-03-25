import { useMemo } from 'react'
import type { ContentLink, NestedContent } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function getUniqueNestedChildLinks(links?: ContentLink[] | null) {
  const seen = new Set<string>()
  const result: ContentLink[] = []

  for (const link of links ?? []) {
    const key = link.id || link.href
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(link)
  }

  return result
}

function contentLinkToStub(link: ContentLink): NestedContent {
  return {
    id: link.id || link.href || '',
    tittel: link.title,
    title: link.title,
    type: link.type,
    children: getUniqueNestedChildLinks(link.children)
      ?.filter((c) => Boolean(c.id || c.href))
      .map(contentLinkToStub),
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
