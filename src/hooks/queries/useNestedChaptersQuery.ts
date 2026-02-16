import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterWithSubchapters } from '../../api'
import type { ContentLink, NestedContent } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'

interface UseNestedChaptersQueryOptions {
  contentId: string
  links?: ContentLink[]
}

export function useNestedChaptersQuery({
  contentId,
  links,
}: UseNestedChaptersQueryOptions) {
  const childrenLinks = useMemo(
    () => getUniqueChildLinks<ContentLink>(links),
    [links],
  )
  const childrenKey = useMemo(
    () => childrenLinks.map((link) => link.href).join(','),
    [childrenLinks],
  )

  const query = useQuery<NestedContent[]>({
    queryKey: ['nested-chapters', contentId, childrenKey],
    queryFn: async ({ signal }) => {
      const chapters: NestedContent[] = []

      for (const link of childrenLinks) {
        if (!link.href) continue

        try {
          const chapter = await fetchChapterWithSubchapters(link.href, signal)
          chapters.push(chapter)
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Failed to fetch chapter:', error)
          }
        }
      }

      return chapters
    },
    enabled: childrenLinks.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  return {
    ...query,
    childrenLinks,
    chapters: query.data || [],
  }
}
