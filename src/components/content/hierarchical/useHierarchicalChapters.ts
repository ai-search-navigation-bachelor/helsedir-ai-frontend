import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterWithSubchapters } from '../../../api'
import type { ContentLink } from '../../../types'
import { getUniqueChildLinks } from '../shared/linkUtils'
import type { ChapterEntry } from './types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

export function useHierarchicalChapters({
  contentId,
  links,
}: UseHierarchicalChaptersOptions) {
  const childrenLinks = useMemo(() => getUniqueChildLinks<ContentLink>(links), [links])

  const childrenKey = useMemo(
    () => childrenLinks.map((link) => link.href).join(','),
    [childrenLinks]
  )

  const { data: chapterEntries, isLoading: isChaptersLoading } = useQuery<ChapterEntry[]>({
    queryKey: ['hierarchical-chapters', contentId, childrenKey],
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        childrenLinks.map(async (link, index): Promise<ChapterEntry> => {
          if (!link.href) return { index, link, fetchError: 'Mangler href i barnelenke' }

          try {
            const chapter = await fetchChapterWithSubchapters(link.href, signal)
            return { index, link, chapter: { ...chapter, type: chapter.type || link.type } }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error
            return {
              index,
              link,
              fetchError: error instanceof Error ? error.message : 'Ukjent feil',
            }
          }
        })
      )
      return entries
    },
    enabled: childrenLinks.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  const entries: ChapterEntry[] =
    chapterEntries ?? childrenLinks.map((link, index) => ({ index, link }))
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
