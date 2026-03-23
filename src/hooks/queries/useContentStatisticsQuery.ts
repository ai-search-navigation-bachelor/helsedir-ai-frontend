import { useQuery } from '@tanstack/react-query'
import { getContentStatistics } from '../../api'
import type { ContentStatisticsResponse } from '../../types'

interface UseContentStatisticsQueryOptions {
  contentId?: string
  enabled?: boolean
}

export function useContentStatisticsQuery({
  contentId,
  enabled = true,
}: UseContentStatisticsQueryOptions) {
  return useQuery<ContentStatisticsResponse>({
    queryKey: ['content-statistics', contentId],
    queryFn: async ({ signal }) => {
      if (!contentId) {
        throw new Error('Mangler content-id for henting av statistikk.')
      }

      return getContentStatistics(contentId, { signal })
    },
    enabled: enabled && Boolean(contentId),
    staleTime: 60 * 60 * 1000,
  })
}
