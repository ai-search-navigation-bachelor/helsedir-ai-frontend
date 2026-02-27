import { useLocation, useParams } from 'react-router-dom'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { isRetningslinjeContentType, isTemasideContentType, normalizeContentType } from '../constants/content'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useTemasideCanonicalRedirect } from '../hooks/useTemasideCanonicalRedirect'
import { useSearchStore } from '../stores/searchStore'
import { ContentPageLoadingSkeleton, DetailPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { ContentPageLayout } from '../components/content/ContentPageLayout'
import { ContentDisplay } from '../components/content/ContentDisplay'

interface ContentDetailProps {
  /** When set, the page uses path-based content fetching (e.g. pathPrefix="retningslinjer") */
  pathPrefix?: string
}

export function ContentDetail({ pathPrefix }: ContentDetailProps) {
  const { id, '*': wildcard } = useParams<{ id: string; '*': string }>()
  const location = useLocation()

  const searchId = useSearchStore((state) => state.searchId)
  const routeState = (location.state as { contentType?: string } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''
  const effectiveSearchId = searchId || undefined

  // When pathPrefix is provided, reconstruct full path from the wildcard segment
  const contentPath = pathPrefix && wildcard ? `/${pathPrefix}/${wildcard}` : undefined

  const { data: content, isLoading, error } = useContentDetailQuery({
    contentId: contentPath ? undefined : id,
    contentPath,
    searchId: effectiveSearchId,
    routeContentType,
  })

  // Always called — no-op unless content is a temaside type
  useTemasideCanonicalRedirect(content)

  if (isLoading) {
    // When route state carries the content type, trust it; otherwise fall back to path prefix heuristic
    const useHierarchicalSkeleton = routeContentType
      ? isRetningslinjeContentType(routeContentType)
      : pathPrefix === 'retningslinjer'

    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
        {useHierarchicalSkeleton ? <ContentPageLoadingSkeleton /> : <DetailPageLoadingSkeleton />}
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

  const type = normalizeContentType(content.content_type)

  if (isTemasideContentType(type)) return null

  return (
    <ContentPageLayout content={content}>
      <ContentDisplay content={content} />
    </ContentPageLayout>
  )
}
