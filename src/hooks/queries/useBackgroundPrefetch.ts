import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchChapter } from '../../lib/content/chapterFetch'
import type { PageNode } from '../../components/content/hierarchical/types'

/**
 * Background pre-fetches content for pages that are still stubs,
 * so they load instantly when the user selects them.
 *
 * Waits until the active page is done loading, then sequentially
 * prefetches remaining pages to avoid flooding the backend.
 */
export function useBackgroundPrefetch(
  pagesById: Map<string, PageNode>,
  activePageId: string | undefined,
  isActiveLoading: boolean,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!activePageId || isActiveLoading) return

    const pagesToPrefetch = Array.from(pagesById.values()).filter(
      (page) =>
        page.node?.id &&
        page.id !== activePageId &&
        !page.isPlaceholder &&
        !page.node.body &&
        !page.node.tekst &&
        !page.node.intro,
    )

    let cancelled = false

    const prefetch = async () => {
      for (const page of pagesToPrefetch) {
        if (cancelled) break
        await queryClient.prefetchQuery({
          queryKey: ['lazy-page-content', page.node.id],
          queryFn: ({ signal }) => fetchChapter(page.node.id, signal),
          staleTime: 10 * 60 * 1000,
        })
      }
    }

    const timer = setTimeout(prefetch, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [activePageId, isActiveLoading, pagesById, queryClient])
}
