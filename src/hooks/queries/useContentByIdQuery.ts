/**
 * TanStack Query hook for fetching a single content item by its backend ID.
 * Used when the app already knows the content ID (e.g. from a search result)
 * and does not need path-based routing or the Helsedirektoratet fallback.
 */
import { useQuery } from '@tanstack/react-query'
import { getContent } from '../../api'
import type { ContentDetail } from '../../types'

interface UseContentByIdQueryOptions {
  contentId?: string | null
  searchId?: string
  enabled?: boolean
  suppressErrorStatuses?: number[]
}

export function useContentByIdQuery({
  contentId,
  searchId,
  enabled = true,
  suppressErrorStatuses,
}: UseContentByIdQueryOptions) {
  return useQuery<ContentDetail>({
    queryKey: ['content', contentId, searchId],
    queryFn: async ({ signal }) => {
      if (!contentId) {
        throw new Error('Mangler content-id')
      }

      return getContent(contentId, searchId, { signal, suppressErrorStatuses })
    },
    enabled: enabled && Boolean(contentId),
    staleTime: 10 * 60 * 1000,
  })
}
