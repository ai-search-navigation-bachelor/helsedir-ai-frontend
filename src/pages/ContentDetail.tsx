import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'
import { Button, Alert, Paragraph } from '@digdir/designsystemet-react'
import { fetchHelsedirContentById, fetchHelsedirContentByTypeAndId, getContent } from '../api'
import { useSearchStore } from '../stores/searchStore'
import { ContentDisplay } from '../components/content'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { hasVisibleContent } from '../components/content/shared/contentTextUtils'
import type { BreadcrumbItem } from '../types/components'
import type { ContentDetail as ContentDetailData, ContentLink, NestedContent } from '../types'

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function getStatusCodeFromError(error: unknown) {
  if (!(error instanceof Error)) return null
  const match = error.message.match(/\b(\d{3})\b/)
  if (!match) return null
  const statusCode = Number(match[1])
  return Number.isNaN(statusCode) ? null : statusCode
}

function shouldFallbackToTypedEndpoint(error: unknown) {
  if (isAbortError(error)) return false
  const statusCode = getStatusCodeFromError(error)
  return statusCode === 400 || statusCode === 404 || statusCode === 405
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

function seedEnrichedContentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  contentId: string,
  enrichedContent: NestedContent,
  extraTypeCandidates: string[] = [],
) {
  const typeCandidates = new Set<string>([
    getNormalizedHelsedirType(enrichedContent),
    ...extraTypeCandidates.map((type) => type.trim().toLowerCase()),
  ])

  for (const type of typeCandidates) {
    if (!type) continue
    queryClient.setQueryData(['enriched-content', type, contentId], enrichedContent)
  }
}

function mergeContentLinks(
  backendLinks?: ContentLink[],
  helsedirLinks?: ContentLink[],
) {
  const merged: ContentLink[] = []
  const seen = new Set<string>()

  for (const link of [...(backendLinks ?? []), ...(helsedirLinks ?? [])]) {
    const href = link.href?.trim()
    if (!href) continue
    const key = `${link.rel}|${link.type}|${href}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(link)
  }

  return merged.length > 0 ? merged : undefined
}

function mergeBackendWithHelsedir(
  backendContent: ContentDetailData,
  helsedirContent: ContentDetailData,
): ContentDetailData {
  const backendBody = backendContent.body || ''
  const shouldUseHelsedirBody = !hasVisibleContent(backendBody) && hasVisibleContent(helsedirContent.body)
  const backendContentTypeTrimmed = backendContent.content_type?.trim()
  const preferredBackendType =
    backendContentTypeTrimmed && backendContentTypeTrimmed.toLowerCase() !== 'innhold'
      ? backendContent.content_type
      : ''

  return {
    ...backendContent,
    title: backendContent.title?.trim() || helsedirContent.title,
    body: shouldUseHelsedirBody ? helsedirContent.body : backendBody,
    content_type: preferredBackendType || helsedirContent.content_type || backendContent.content_type,
    links: mergeContentLinks(backendContent.links, helsedirContent.links),
  }
}

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const searchId = useSearchStore((state) => state.searchId)
  const searchQuery = useSearchStore((state) => state.searchQuery)
  const routeState = (location.state as { contentType?: string } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''

  const effectiveSearchId = searchId || undefined
  const effectiveSearchQuery = searchQuery || ''

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['content', id, effectiveSearchId, routeContentType],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('ID mangler')

      const fetchFromBackend = async () =>
        getContent(id, effectiveSearchId, { signal, suppressErrorStatuses: [404] })

      const fetchFromHelsedir = async () => {
        try {
          return await fetchHelsedirContentById(id, signal) as NestedContent
        } catch (helsedirError) {
          if (!routeContentType || !shouldFallbackToTypedEndpoint(helsedirError)) {
            throw helsedirError
          }
          return await fetchHelsedirContentByTypeAndId(
            routeContentType,
            id,
            signal,
          ) as NestedContent
        }
      }

      try {
        const backendContent = await fetchFromBackend()

        try {
          const helsedirContent = await fetchFromHelsedir()
          const mappedHelsedirContent = mapHelsedirContentToDetail(helsedirContent)
          const mergedContent = mergeBackendWithHelsedir(backendContent, mappedHelsedirContent)

          seedEnrichedContentCache(queryClient, id, helsedirContent, [
            routeContentType,
            backendContent.content_type,
            mergedContent.content_type,
          ])

          return mergedContent
        } catch (helsedirError) {
          if (isAbortError(helsedirError) || signal.aborted) {
            throw helsedirError
          }
          return backendContent
        }
      } catch (backendError) {
        if (isAbortError(backendError) || signal.aborted) {
          throw backendError
        }

        if (!shouldFallbackToTypedEndpoint(backendError)) {
          throw backendError
        }

        const helsedirContent = await fetchFromHelsedir()
        const mappedHelsedirContent = mapHelsedirContentToDetail(helsedirContent)
        seedEnrichedContentCache(queryClient, id, helsedirContent, [
          routeContentType,
          mappedHelsedirContent.content_type,
        ])
        return mappedHelsedirContent
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })

  const breadcrumbItems: BreadcrumbItem[] = effectiveSearchQuery
    ? [
        { label: 'Forside', href: '/' },
        {
          label: effectiveSearchQuery,
          href: `/search?query=${encodeURIComponent(effectiveSearchQuery)}`,
          icon: <MagnifyingGlassIcon style={{ width: '18px', height: '18px' }} />
        },
        { label: content?.title || 'Laster...', href: '#' }
      ]
    : []

  return (
    <div className="max-w-screen-xl mx-auto px-8 pt-4 pb-8">
      {effectiveSearchQuery ? (
        <Breadcrumb items={breadcrumbItems} />
      ) : (
        <Button
          variant='tertiary'
          onClick={() => navigate(-1)}
          style={{ marginBottom: '24px' }}
        >
          ← Tilbake
        </Button>
      )}

      {isLoading && (
        <ContentPageLoadingSkeleton />
      )}

      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Henting av innhold feilet'}
          </Paragraph>
        </Alert>
      )}

      {content && <ContentDisplay content={content} />}
    </div>
  )
}
