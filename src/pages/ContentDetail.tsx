import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'
import { Button, Alert, Paragraph } from '@digdir/designsystemet-react'
import { fetchHelsedirContentById, fetchHelsedirContentByTypeAndId, getContent } from '../api'
import { ApiError } from '../lib/httpClient'
import { useSearchStore } from '../stores/searchStore'
import { ContentDisplay } from '../components/content'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import type { BreadcrumbItem } from '../types/components'
import type { ContentDetail as ContentDetailData, ContentLink, NestedContent } from '../types'

function shouldFallbackToHelsedir(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

function getStatusCodeFromError(error: unknown) {
  if (!(error instanceof Error)) return null
  const match = error.message.match(/\b(\d{3})\b/)
  if (!match) return null
  const statusCode = Number(match[1])
  return Number.isNaN(statusCode) ? null : statusCode
}

function shouldFallbackToTypedEndpoint(error: unknown) {
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

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

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

      const fetchFromHelsedir = async () => {
        try {
          const helsedirContent = await fetchHelsedirContentById(id, signal) as NestedContent
          return mapHelsedirContentToDetail(helsedirContent)
        } catch (helsedirError) {
          if (!routeContentType || !shouldFallbackToTypedEndpoint(helsedirError)) {
            throw helsedirError
          }
          const typedContent = await fetchHelsedirContentByTypeAndId(
            routeContentType,
            id,
            signal,
          ) as NestedContent
          return mapHelsedirContentToDetail(typedContent)
        }
      }

      // When we navigate from hierarchical pages, we usually have contentType in route state.
      // In that case prefer Helsedirektoratet first to avoid expected backend 404 noise.
      if (routeContentType) {
        try {
          return await fetchFromHelsedir()
        } catch {
          return await getContent(id, effectiveSearchId, { signal, suppressErrorStatuses: [404] })
        }
      }

      try {
        return await getContent(id, effectiveSearchId, { signal, suppressErrorStatuses: [404] })
      } catch (error) {
        if (!shouldFallbackToHelsedir(error)) throw error
        return await fetchFromHelsedir()
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
