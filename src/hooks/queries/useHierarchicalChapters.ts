import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchChapterWithSubchapters } from '../../api'
import type { ContentLink } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function isCancellationError(error: unknown) {
  if (!(error instanceof Error)) return false
  const name = error.name.toLowerCase()
  const message = error.message.toLowerCase()
  return (
    name === 'aborterror' ||
    name === 'cancellederror' ||
    name === 'cancelederror' ||
    message.includes('aborted') ||
    message.includes('canceled') ||
    message.includes('cancelled')
  )
}

export function useHierarchicalChapters({
  contentId,
  links,
}: UseHierarchicalChaptersOptions) {
  const childrenLinks = useMemo(() => getUniqueChildLinks<ContentLink>(links), [links])
  const chapterQueries = useQueries({
    queries: childrenLinks.map((link) => ({
      queryKey: ['hierarchical-chapter', contentId, link.href, link.type || ''],
      queryFn: async ({ signal }) => {
        if (!link.href) {
          throw new Error('Mangler href i barnelenke')
        }
        const chapter = await fetchChapterWithSubchapters(link.href, signal)
        return { ...chapter, type: chapter.type || link.type }
      },
      enabled: Boolean(link.href),
      staleTime: 10 * 60 * 1000,
      retry: 1,
    })),
  })

  const entries: ChapterEntry[] = childrenLinks.map((link, index) => {
    const query = chapterQueries[index]
    if (!query) return { index, link }
    if (!link.href) return { index, link, fetchError: 'Mangler href i barnelenke' }
    if (query.data) return { index, link, chapter: query.data }
    if (
      !query.isPending &&
      query.error &&
      !isCancellationError(query.error)
    ) {
      return {
        index,
        link,
        fetchError:
          query.error instanceof Error ? query.error.message : 'Ukjent feil',
      }
    }
    return { index, link }
  })
  const isChaptersLoading = chapterQueries.some((query) => query.isPending || query.isFetching)
  const loadedChapters = entries.filter(
    (entry): entry is ChapterEntry & { chapter: NonNullable<ChapterEntry['chapter']> } => Boolean(entry.chapter)
  )
  const failedEntries = entries.filter((entry) => !entry.chapter && Boolean(entry.fetchError))

  return {
    childrenLinks,
    entries,
    loadedChapters,
    failedEntries,
    isChaptersLoading,
  }
}
