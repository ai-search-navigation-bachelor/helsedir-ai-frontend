/**
 * TanStack Query hook for fetching enriched (full-depth) content from the
 * Helsedirektoratet external API.
 *
 * The backend API sometimes returns shallow content without chapter bodies.
 * This hook supplements that data by fetching the same document directly from
 * helsedirektoratet.no, giving the content detail view access to the full text,
 * nested chapters, and Helsedirektoratet-specific fields (styrke, praktisk, etc.).
 * Falls back to the typed endpoint if the generic ID lookup fails with 400/404.
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchHelsedirContentById,
  fetchHelsedirContentByTypeAndId,
  getHelsedirEndpointByContentType,
} from '../../api'
import { normalizeContentType } from '../../constants/content'
import { shouldFallbackToTypedEndpoint } from '../../lib/content/queryError'
import type { NestedContent } from '../../types'

interface UseEnrichedContentQueryOptions {
  contentId?: string
  contentType?: string
  enabled?: boolean
}

export function useEnrichedContentQuery({
  contentId,
  contentType,
  enabled = true,
}: UseEnrichedContentQueryOptions) {
  const normalizedType = normalizeContentType(contentType)

  return useQuery<NestedContent>({
    queryKey: ['enriched-content', normalizedType, contentId],
    queryFn: async ({ signal }) => {
      if (!contentId) {
        throw new Error('Mangler content-id for henting av utvidet innhold.')
      }

      try {
        return await fetchHelsedirContentById(contentId, signal) as NestedContent
      } catch (error) {
        const typedEndpoint = getHelsedirEndpointByContentType(normalizedType)
        if (!typedEndpoint || !shouldFallbackToTypedEndpoint(error)) {
          throw error
        }

        return await fetchHelsedirContentByTypeAndId(
          normalizedType,
          contentId,
          signal,
        ) as NestedContent
      }
    },
    enabled: enabled && Boolean(contentId),
    staleTime: 10 * 60 * 1000,
  })
}
