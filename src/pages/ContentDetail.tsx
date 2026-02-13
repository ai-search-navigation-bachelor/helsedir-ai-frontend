import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Alert, Paragraph } from '@digdir/designsystemet-react'
import { fetchHelsedirContentById, fetchHelsedirContentByTypeAndId, getContent } from '../api'
import {
  getMainCategoryBySubcategory,
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
} from '../constants/categories'
import { TEMASIDE_CATEGORIES } from '../constants/temasider'
import { useSearchStore } from '../stores/searchStore'
import { useTemasideBreadcrumbStore } from '../stores'
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

function normalizePath(path: string) {
  return (path || '/').replace(/\/+$/, '') || '/'
}

function getContentIdFromHref(href?: string | null): string | null {
  if (!href) return null

  try {
    const parsed = new URL(href)
    const segments = parsed.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  } catch {
    const normalized = href.split('?')[0].replace(/\/+$/, '')
    const segments = normalized.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  }
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

function getTemasideCategoryByPath(path: string) {
  return TEMASIDE_CATEGORIES.find((category) => category.path === path)
}

function getTemasideCategoryPathFromContentLinks(
  links: Array<{ rel: string; href: string }> | undefined,
): string | null {
  const parentHref = links?.find((link) => link.rel === 'forelder')?.href
  if (!parentHref) return null

  const segments = normalizePath(parentHref).split('/').filter(Boolean)
  if (segments.length === 0) return null

  return `/${segments[0]}`
}

function getSourceTemasideIdFromLocationState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null

  const sourceTemasideId = (state as { sourceTemasideId?: unknown }).sourceTemasideId
  if (typeof sourceTemasideId !== 'string') return null

  const trimmed = sourceTemasideId.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getSearchQueryFromLocationState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null

  const fromSearch = (state as { fromSearch?: unknown }).fromSearch
  const searchQuery = (state as { searchQuery?: unknown }).searchQuery
  if (fromSearch !== true || typeof searchQuery !== 'string') return null

  const trimmed = searchQuery.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getSearchCategoryContextFromLocationState(
  state: unknown,
): { categoryId: string | null; categoryName: string | null } {
  if (!state || typeof state !== 'object') {
    return { categoryId: null, categoryName: null }
  }

  const fromSearch = (state as { fromSearch?: unknown }).fromSearch
  if (fromSearch !== true) {
    return { categoryId: null, categoryName: null }
  }

  const rawCategoryId = (state as { searchCategoryId?: unknown }).searchCategoryId
  const rawCategoryName = (state as { searchCategoryName?: unknown }).searchCategoryName

  const categoryId =
    typeof rawCategoryId === 'string' && rawCategoryId.trim().length > 0
      ? rawCategoryId.trim()
      : null
  const categoryName =
    typeof rawCategoryName === 'string' && rawCategoryName.trim().length > 0
      ? rawCategoryName.trim()
      : null

  return { categoryId, categoryName }
}

function getSourceContentContextFromLocationState(
  state: unknown,
): { id: string | null; title: string | null } {
  if (!state || typeof state !== 'object') return { id: null, title: null }

  const rawSourceContentId = (state as { sourceContentId?: unknown }).sourceContentId
  const rawSourceContentTitle = (state as { sourceContentTitle?: unknown }).sourceContentTitle

  const id =
    typeof rawSourceContentId === 'string' && rawSourceContentId.trim().length > 0
      ? rawSourceContentId.trim()
      : null
  const title =
    typeof rawSourceContentTitle === 'string' && rawSourceContentTitle.trim().length > 0
      ? rawSourceContentTitle.trim()
      : null

  return { id, title }
}

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const searchId = useSearchStore((state) => state.searchId)
  const routeState = (location.state as { contentType?: string } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''
  const temasideTrailByPath = useTemasideBreadcrumbStore((state) => state.trailByPath)
  const temasideLastPath = useTemasideBreadcrumbStore((state) => state.lastPath)

  const effectiveSearchId = searchId || undefined
  const sourceTemasideId = getSourceTemasideIdFromLocationState(location.state)
  const searchReturnQuery = getSearchQueryFromLocationState(location.state)
  const { categoryId: searchCategoryId, categoryName: searchCategoryName } =
    getSearchCategoryContextFromLocationState(location.state)
  const { id: sourceContentId, title: sourceContentTitleFromState } =
    getSourceContentContextFromLocationState(location.state)

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

  const { data: sourceTemasideContent } = useQuery({
    queryKey: ['content', sourceTemasideId, effectiveSearchId],
    queryFn: async ({ signal }) => {
      if (!sourceTemasideId) throw new Error('Mangler source temaside-id')
      return getContent(sourceTemasideId, effectiveSearchId, { signal })
    },
    enabled: Boolean(sourceTemasideId && sourceTemasideId !== id),
    staleTime: 10 * 60 * 1000,
  })

  const { data: sourceContentForBreadcrumb } = useQuery({
    queryKey: ['content', sourceContentId, effectiveSearchId],
    queryFn: async ({ signal }) => {
      if (!sourceContentId) throw new Error('Mangler source content-id')
      return getContent(sourceContentId, effectiveSearchId, { signal })
    },
    enabled: Boolean(
      sourceContentId &&
      sourceContentId !== id &&
      sourceContentId !== sourceTemasideId &&
      !sourceContentTitleFromState,
    ),
    staleTime: 10 * 60 * 1000,
  })

  const fallbackBreadcrumbItems: BreadcrumbItem[] = content
    ? [
        { label: 'Forside', href: '/' },
        { label: content.title, href: '#' },
      ]
    : []

  const searchMainCategoryId = searchCategoryId
    ? getMainCategoryBySubcategory(searchCategoryId)
    : undefined
  const searchMainCategoryLabel = searchMainCategoryId
    ? SEARCH_MAIN_CATEGORIES.find((category) => category.id === searchMainCategoryId)?.label
    : undefined
  const searchSubcategoryLabel = searchCategoryName || (
    searchCategoryId && searchCategoryId in SEARCH_SUBCATEGORY_LABELS
      ? SEARCH_SUBCATEGORY_LABELS[searchCategoryId as keyof typeof SEARCH_SUBCATEGORY_LABELS]
      : undefined
  )

  const rootLink = content?.links?.find((link) => link.rel === 'root')
  const parentLink = content?.links?.find((link) => link.rel === 'forelder')
  const rootContentId = getContentIdFromHref(rootLink?.href)
  const parentContentId = getContentIdFromHref(parentLink?.href)

  const linkHierarchyBreadcrumbItems: BreadcrumbItem[] =
    content && (rootContentId || parentContentId)
      ? [
          { label: 'Forside', href: '/' },
          ...(rootContentId && rootLink?.tittel && rootContentId !== content.id
            ? [{ label: rootLink.tittel, href: `/content/${rootContentId}` }]
            : []),
          ...(parentContentId &&
          parentLink?.tittel &&
          parentContentId !== content.id &&
          parentContentId !== rootContentId
            ? [{ label: parentLink.tittel, href: `/content/${parentContentId}` }]
            : []),
          { label: content.title, href: '#' },
        ]
      : []

  const searchHierarchyBreadcrumbItems: BreadcrumbItem[] =
    content && searchReturnQuery && content.content_type !== 'temaside'
      ? [
          { label: 'Forside', href: '/' },
          { label: 'Søk', href: '#' },
          ...(searchMainCategoryId && searchMainCategoryLabel
            ? [{ label: searchMainCategoryLabel, href: '#' }]
            : []),
          ...(searchCategoryId && searchSubcategoryLabel && searchCategoryId !== searchMainCategoryId
            ? [{ label: searchSubcategoryLabel, href: '#' }]
            : []),
          { label: content.title, href: '#' },
        ]
      : []

  const temasideCategoryPath = getTemasideCategoryPathFromContentLinks(content?.links)
  const temasideCategory = temasideCategoryPath
    ? getTemasideCategoryByPath(temasideCategoryPath)
    : undefined

  const temasideCanonicalBreadcrumbItems: BreadcrumbItem[] =
    content?.content_type === 'temaside' && temasideCategoryPath
      ? [
          { label: 'Forside', href: '/' },
          {
            label: temasideCategory?.title || content.title,
            href: `/temaside${temasideCategoryPath}`,
          },
          ...(temasideCategory?.title !== content.title
            ? [{ label: content.title, href: '#' }]
            : []),
        ]
      : []

  const sourceTemasideCategoryPath = getTemasideCategoryPathFromContentLinks(sourceTemasideContent?.links)
  const sourceTemasideCategory = sourceTemasideCategoryPath
    ? getTemasideCategoryByPath(sourceTemasideCategoryPath)
    : undefined

  const relatedTemasideBreadcrumbItems: BreadcrumbItem[] =
    content && content.content_type !== 'temaside' && sourceTemasideContent && sourceTemasideCategoryPath
      ? [
          { label: 'Forside', href: '/' },
          {
            label: sourceTemasideCategory?.title || sourceTemasideContent.title,
            href: `/temaside${sourceTemasideCategoryPath}`,
          },
          { label: sourceTemasideContent.title, href: `/content/${sourceTemasideContent.id}` },
          { label: content.title, href: '#' },
        ]
      : []

  const sourceContentTitle = sourceContentTitleFromState || sourceContentForBreadcrumb?.title || null

  const extendedTemasideBreadcrumbItems: BreadcrumbItem[] =
    content &&
    content.content_type !== 'temaside' &&
    sourceTemasideContent &&
    sourceTemasideCategoryPath &&
    sourceContentId &&
    sourceContentId !== sourceTemasideContent.id &&
    sourceContentId !== content.id &&
    sourceContentTitle
      ? [
          { label: 'Forside', href: '/' },
          {
            label: sourceTemasideCategory?.title || sourceTemasideContent.title,
            href: `/temaside${sourceTemasideCategoryPath}`,
          },
          { label: sourceTemasideContent.title, href: `/content/${sourceTemasideContent.id}` },
          { label: sourceContentTitle, href: `/content/${sourceContentId}` },
          { label: content.title, href: '#' },
        ]
      : []

  const sanitizeTemasideItems = (items: BreadcrumbItem[]) =>
    items.filter((item) => item.label.toLowerCase() !== 'temasider')

  const temasideBreadcrumbItems: BreadcrumbItem[] =
    !searchReturnQuery && temasideLastPath && temasideTrailByPath[temasideLastPath]
      ? [
          ...sanitizeTemasideItems(
            temasideTrailByPath[temasideLastPath].slice(
              0,
              Math.max(temasideTrailByPath[temasideLastPath].length - 1, 0),
            ),
          ),
          { label: content?.title || 'Laster...', href: '#' },
        ]
      : []

  const activeBreadcrumbItems =
    temasideCanonicalBreadcrumbItems.length > 0
      ? temasideCanonicalBreadcrumbItems
      : extendedTemasideBreadcrumbItems.length > 0
        ? extendedTemasideBreadcrumbItems
        : relatedTemasideBreadcrumbItems.length > 0
          ? relatedTemasideBreadcrumbItems
          : linkHierarchyBreadcrumbItems.length > 0
            ? linkHierarchyBreadcrumbItems
            : searchHierarchyBreadcrumbItems.length > 0
              ? searchHierarchyBreadcrumbItems
              : temasideBreadcrumbItems.length > 0
                ? temasideBreadcrumbItems
                : fallbackBreadcrumbItems

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-10 pb-8">
      {activeBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={activeBreadcrumbItems} />
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
