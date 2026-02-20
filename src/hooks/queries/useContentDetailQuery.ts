import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchHelsedirContentById,
  fetchHelsedirContentByTypeAndId,
  getContent,
  getContentByPath,
} from '../../api'
import { normalizeContentType } from '../../constants/content'
import { isAbortError, shouldFallbackToTypedEndpoint } from '../../lib/content/queryError'
import type { ContentDetail as ContentDetailData, ContentLink, NestedContent } from '../../types'

interface UseContentDetailQueryOptions {
  contentId?: string
  contentPath?: string
  searchId?: string
  routeContentType?: string
}

function toContentLinks(source: NestedContent): ContentLink[] {
  const rawLinks = [...(source.links ?? []), ...(source.lenker ?? [])]
  const seen = new Set<string>()
  const result: ContentLink[] = []

  for (const link of rawLinks) {
    const href = link.href?.trim()
    if (!href || seen.has(href)) continue
    seen.add(href)
    result.push({
      rel: link.rel || 'related',
      type: link.type || 'link',
      tittel: link.tittel || 'Lenke',
      href,
      strukturId: undefined,
    })
  }

  return result
}

function mapHelsedirContentToDetail(source: NestedContent): ContentDetailData {
  const contentType =
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    'innhold'

  return {
    id: source.id,
    title: source.tittel || source.title || source.id,
    body: source.tekst || source.body || '',
    content_type: contentType,
    links: toContentLinks(source),
  }
}

function getNormalizedHelsedirType(source: NestedContent) {
  return (
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    ''
  )
}

export function useContentDetailQuery({
  contentId,
  contentPath,
  searchId,
  routeContentType,
}: UseContentDetailQueryOptions) {
  const queryClient = useQueryClient()
  const normalizedRouteContentType = normalizeContentType(routeContentType)
  const queryIdentifier = contentPath || contentId

  return useQuery<ContentDetailData>({
    queryKey: ['content', queryIdentifier, searchId, normalizedRouteContentType],
    queryFn: async ({ signal }) => {
      if (!contentId && !contentPath) throw new Error('ID eller path mangler')

      const fetchFromBackend = async () =>
        contentPath
          ? getContentByPath(contentPath, searchId, { signal, suppressErrorStatuses: [404] })
          : getContent(contentId!, searchId, { signal, suppressErrorStatuses: [404] })

      const fetchFromHelsedir = async (id: string) => {
        try {
          return await fetchHelsedirContentById(id, signal) as NestedContent
        } catch (helsedirError) {
          if (!normalizedRouteContentType || !shouldFallbackToTypedEndpoint(helsedirError)) {
            throw helsedirError
          }

          return await fetchHelsedirContentByTypeAndId(
            normalizedRouteContentType,
            id,
            signal,
          ) as NestedContent
        }
      }

      try {
        return await fetchFromBackend()
      } catch (backendError) {
        if (isAbortError(backendError) || signal.aborted) {
          throw backendError
        }

        if (!contentId || !shouldFallbackToTypedEndpoint(backendError)) {
          throw backendError
        }

        const helsedirContent = await fetchFromHelsedir(contentId)
        const mappedHelsedirContent = mapHelsedirContentToDetail(helsedirContent)
        const typeCandidates = new Set<string>([
          getNormalizedHelsedirType(helsedirContent),
          normalizedRouteContentType,
          mappedHelsedirContent.content_type.trim().toLowerCase(),
        ])

        for (const type of typeCandidates) {
          if (!type) continue
          queryClient.setQueryData(['enriched-content', type, contentId], helsedirContent)
        }

        return mappedHelsedirContent
      }
    },
    enabled: Boolean(contentId || contentPath),
    staleTime: 10 * 60 * 1000,
  })
}
