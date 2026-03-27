import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchChapter } from '../../lib/content/chapterFetch'
import type { PageNode } from '../../components/content/hierarchical/types'

/**
 * Background pre-fetches content for pages that are still stubs,
 * so they load instantly when the user selects them and are
 * available for text-based filtering on the overview page.
 *
 * Starts prefetching as soon as pages are available, sequentially
 * to avoid flooding the backend.
 */
export function useBackgroundPrefetch(
  pagesById: Map<string, PageNode>,
  activePageId: string | undefined,
  isActiveLoading: boolean,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Wait for the active page to finish loading before prefetching others,
    // but if no page is selected (overview mode), start immediately.
    if (activePageId && isActiveLoading) return

    const pagesToPrefetch = Array.from(pagesById.values()).filter(
      (page) =>
        page.node?.id &&
        page.id !== activePageId &&
        !page.isPlaceholder &&
        !page.node.body &&
        !page.node.tekst &&
        !page.node.intro,
    )

    if (pagesToPrefetch.length === 0) return

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
