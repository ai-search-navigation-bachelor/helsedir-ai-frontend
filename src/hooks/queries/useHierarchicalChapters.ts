import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { ContentLink, NestedContent } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import { fetchChapter } from '../../lib/content/chapterFetch'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function contentLinkToStub(link: ContentLink): NestedContent {
  return {
    id: link.id || link.href || '',
    tittel: link.tittel,
    type: link.type,
    children: link.children
      ?.filter((c) => Boolean(c.id || c.href))
      .map(contentLinkToStub),
  }
}

export function useHierarchicalChapters({
  contentId,
  links,
}: UseHierarchicalChaptersOptions) {
  const childrenLinks = useMemo(() => getUniqueChildLinks<ContentLink>(links), [links])

  const chapterQueries = useQueries({
    queries: childrenLinks.map((link) => ({
      queryKey: ['hierarchical-chapter', contentId, link.id || link.href],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const idOrHref = link.id || link.href
        if (!idOrHref) throw new Error('Mangler id og href i barnelenke')
        const chapter = await fetchChapter(idOrHref, signal)
        return { ...chapter, type: chapter.type || link.type }
      },
      enabled: Boolean(link.id || link.href),
      staleTime: 10 * 60 * 1000,
      retry: 1,
    })),
  })

  const entries: ChapterEntry[] = childrenLinks.map((link, index) => {
    const query = chapterQueries[index]
    if (!query) return { index, link, chapter: contentLinkToStub(link) }

    if (query.data) return { index, link, chapter: query.data }

    if (!query.isPending && query.error) {
      return {
        index,
        link,
        chapter: contentLinkToStub(link),
        fetchError: query.error instanceof Error ? query.error.message : 'Ukjent feil',
      }
    }

    // Use stub while loading
    return { index, link, chapter: contentLinkToStub(link) }
  })

  const isChaptersLoading = chapterQueries.some((query) => query.isPending || query.isFetching)
  const loadedChapters = entries.filter(
    (entry): entry is ChapterEntry & { chapter: NonNullable<ChapterEntry['chapter']> } =>
      Boolean(entry.chapter),
  )
  const failedEntries = entries.filter((entry) => Boolean(entry.fetchError))

  return {
    childrenLinks,
    entries,
    loadedChapters,
    failedEntries,
    isChaptersLoading,
  }
}
