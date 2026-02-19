import { useLocation, useParams } from 'react-router-dom'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import {
  isRecommendationContentType,
  isRetningslinjeContentType,
  isTemasideContentType,
  normalizeContentType,
  toContentTypeLabel,
} from '../constants/content'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useTemasideCanonicalRedirect } from '../hooks/useTemasideCanonicalRedirect'
import { useSearchStore } from '../stores/searchStore'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { ContentPageLayout } from '../components/content/ContentPageLayout'
import { HierarchicalContentDisplay } from '../components/content/hierarchical/HierarchicalContentDisplay'
import { DetailContentDisplay } from '../components/content/detail/DetailContentDisplay'
import { countUniqueChildLinks } from '../components/content/shared/linkUtils'

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const searchId = useSearchStore((state) => state.searchId)
  const routeState = (location.state as { contentType?: string } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''
  const effectiveSearchId = searchId || undefined

  const { data: content, isLoading, error } = useContentDetailQuery({
    contentId: id,
    searchId: effectiveSearchId,
    routeContentType,
  })

  // Always called — no-op unless content is a temaside type
  useTemasideCanonicalRedirect(content)

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-12 pt-4 pb-8">
        <ContentPageLoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto px-12 pt-4 pb-8">
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

  const typeLabel = toContentTypeLabel(content.content_type)
  const hasChildren = countUniqueChildLinks(content.links) > 0

  return (
    <ContentPageLayout content={content}>
      {isRetningslinjeContentType(type) || hasChildren ? (
        <HierarchicalContentDisplay content={content} typeLabel={typeLabel} />
      ) : isRecommendationContentType(type) ? (
        <DetailContentDisplay content={content} />
      ) : (
        <DetailContentDisplay
          content={content}
          typeLabelOverride={typeLabel}
          primarySectionTitle="Innhold"
        />
      )}
    </ContentPageLayout>
  )
}
