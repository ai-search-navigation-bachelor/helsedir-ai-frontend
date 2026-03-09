import { useMemo } from 'react'
import type { ContentLink, NestedContent } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function contentLinkToStub(link: ContentLink): NestedContent {
  return {
    id: link.id || link.href || '',
    tittel: link.title,
    title: link.title,
    type: link.type,
    children: link.children
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
