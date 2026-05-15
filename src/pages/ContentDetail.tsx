/**
 * Content detail page.
 * Fetches content by ID or path param, redirects temaside content to its canonical path,
 * and delegates rendering to {@link ContentDisplay} based on content type.
 */
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import {
  isTemasideContentType,
  normalizeContentType,
} from '../constants/content'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useParentChainQuery } from '../hooks/queries/useParentChainQuery'
import { useTemasideCanonicalRedirect } from '../hooks/useTemasideCanonicalRedirect'
import { useSearchStore } from '../stores/searchStore'
import {
  ContentPageLoadingSkeleton,
  DetailPageLoadingSkeleton,
} from '../components/content/ContentSkeletons'
import {
  resolveContentPresentation,
  resolveContentPresentationFromHint,
} from '../components/content/contentPresentation'
import { ContentPageLayout } from '../components/content/ContentPageLayout'
import { ContentDisplay } from '../components/content/ContentDisplay'

interface ContentDetailProps {
  /** When set, the page uses path-based content fetching (e.g. pathPrefix="retningslinjer") */
  pathPrefix?: string
}

export function ContentDetail({ pathPrefix }: ContentDetailProps) {
  const { id, '*': wildcard } = useParams<{ id: string; '*': string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const searchId = useSearchStore((state) => state.searchId)
  const routeState = (location.state as {
    contentType?: string
    skipHelsedirFallback?: boolean
  } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''
  const skipHelsedirFallback = routeState?.skipHelsedirFallback === true
  const effectiveSearchId = searchId || undefined

  const contentPath = pathPrefix && wildcard ? `/${pathPrefix}/${wildcard}` : undefined
  const isLegacyIdRoute = !pathPrefix && !wildcard

  const { data: content, isLoading, error } = useContentDetailQuery({
    contentId: contentPath ? undefined : id,
    contentPath,
    searchId: effectiveSearchId,
    routeContentType,
    skipHelsedirFallback,
  })

  useTemasideCanonicalRedirect(content)

  const { data: parentChainResult, isLoading: isParentChainLoading } = useParentChainQuery(
    content,
    effectiveSearchId,
  )

  const type = normalizeContentType(content?.content_type)
  const isChapterContent = type === 'kapittel'
  const normalizePath = (path: string) => path.replace(/\/+$/, '')
  const pendingCanonicalRedirect = Boolean(
    !isChapterContent &&
    isLegacyIdRoute &&
    content?.path &&
    normalizePath(content.path) !== normalizePath(location.pathname),
  )

  // When accessed via /content/:id and the content has a canonical path, redirect there.
  // Chapters should skip this so we do not bounce through the chapter path before redirecting
  // to the hierarchical publication root.
  useEffect(() => {
    if (isChapterContent) return
    if (!pathPrefix && !wildcard && content?.path) {
      const normalize = (p: string) => p.replace(/\/+$/, '')
      if (normalize(content.path) !== normalize(location.pathname)) {
        navigate(content.path, { replace: true, state: location.state })
      }
    }
  }, [content?.path, isChapterContent, pathPrefix, wildcard, navigate, location.pathname, location.state])

  const chapterRootEntry = useMemo(() => {
    if (!isChapterContent) return null

    const chain = parentChainResult?.chain ?? []
    const reversedChain = [...chain].reverse()

    const nearestPublicationParent = reversedChain.find((entry) => {
      const normalizedParentType = normalizeContentType(entry.contentType)
      return normalizedParentType !== 'kapittel' && !isTemasideContentType(normalizedParentType)
    })

    if (nearestPublicationParent) return nearestPublicationParent

    return reversedChain.find((entry) => normalizeContentType(entry.contentType) !== 'kapittel') ?? null
  }, [isChapterContent, parentChainResult?.chain])

  const redirectState = (() => {
    if (!routeState) {
      return {
        sectionId: content?.id,
        ...(chapterRootEntry?.contentType
          ? { contentType: chapterRootEntry.contentType }
          : {}),
      }
    }

    const restRouteState = { ...routeState }
    delete restRouteState.contentType

    return {
      ...restRouteState,
      sectionId: content?.id,
      ...(chapterRootEntry?.contentType
        ? { contentType: chapterRootEntry.contentType }
        : {}),
    }
  })()

  useEffect(() => {
    if (!content || !isChapterContent || !chapterRootEntry) return

    navigate(chapterRootEntry.href, {
      replace: true,
      state: redirectState,
    })
  }, [chapterRootEntry, content, isChapterContent, navigate, redirectState])

  if (isLoading) {
    const presentation =
      isLegacyIdRoute && !routeContentType
        ? 'hierarchical'
        : resolveContentPresentationFromHint({
            routeContentType,
          })

    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
        {presentation === 'hierarchical' ? <ContentPageLoadingSkeleton /> : <DetailPageLoadingSkeleton />}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-4 pb-8 sm:px-6 lg:px-12">
        <Alert data-color="danger">
          <Paragraph>
            {error instanceof Error ? error.message : 'Henting av innhold feilet'}
          </Paragraph>
        </Alert>
      </div>
    )
  }

  if (!content) return null

  if (isTemasideContentType(type)) return null

  if (pendingCanonicalRedirect) {
    const presentation = resolveContentPresentation(content)

    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
        {presentation === 'hierarchical' ? <ContentPageLoadingSkeleton /> : <DetailPageLoadingSkeleton />}
      </div>
    )
  }

  if (isChapterContent && (isParentChainLoading || chapterRootEntry)) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
        <ContentPageLoadingSkeleton />
      </div>
    )
  }

  return (
    <ContentPageLayout content={content}>
      <ContentDisplay content={content} />
    </ContentPageLayout>
  )
}
