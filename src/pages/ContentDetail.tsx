import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Paragraph } from '@digdir/designsystemet-react'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useContentDetailBreadcrumbs } from '../hooks/useContentDetailBreadcrumbs'
import { useSearchStore } from '../stores/searchStore'
import { ContentDisplay } from '../components/content'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { Breadcrumb } from '../components/ui/Breadcrumb'

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const { activeBreadcrumbItems } = useContentDetailBreadcrumbs({
    content,
    currentContentId: id,
    locationState: location.state,
    searchId: effectiveSearchId,
  })

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-4 pb-8">
      {activeBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={activeBreadcrumbItems} />
      ) : (
        <Button
          variant='tertiary'
          onClick={() => navigate(-1)}
          style={{ marginBottom: '24px' }}
        >
          &larr; Tilbake
        </Button>
      )}

      {isLoading && <ContentPageLoadingSkeleton />}

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
