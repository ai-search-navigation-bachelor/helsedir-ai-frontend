import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { ContentDisplay } from '../components/content'
import { TemasideLoadingSkeleton } from '../components/content/temaside/TemasideSkeletons'
import { TemasideHubStatusView } from '../components/content/temaside'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useContentByIdQuery } from '../hooks/queries/useContentByIdQuery'
import { useTemasideHubPageModel } from '../hooks/useTemasideHubPageModel'
import type { TemasideCategorySlug } from '../constants/temasider'

interface TemasideLeafPageProps {
  categorySlug: TemasideCategorySlug
}

export function TemasideLeafPage({ categorySlug }: TemasideLeafPageProps) {
  const {
    breadcrumbItems,
    category,
    contentId,
    error,
    isError,
    isLoading,
    node,
    temaPath,
  } = useTemasideHubPageModel(categorySlug)

  const hasContentId = Boolean(contentId)

  const {
    data: leafContent,
    isLoading: isLeafLoading,
    error: leafError,
  } = useContentByIdQuery({ contentId, enabled: hasContentId })

  if (!category) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        details={<>Ukjent kategori for: <code>{temaPath}</code></>}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
        <TemasideLoadingSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <TemasideHubStatusView
        title="Kunne ikke laste temasider"
        breadcrumbItems={breadcrumbItems}
        details={error?.message}
      />
    )
  }

  if (!node) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        breadcrumbItems={breadcrumbItems}
        details={<>Ingen treff for: <code>{temaPath}</code></>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
      <Breadcrumb items={breadcrumbItems} />

      {isLeafLoading && <TemasideLoadingSkeleton />}

      {leafError && (
        <Alert data-color="danger">
          <Paragraph>
            {leafError instanceof Error ? leafError.message : 'Kunne ikke laste temasideinnhold'}
          </Paragraph>
        </Alert>
      )}

      {leafContent && <ContentDisplay content={leafContent} />}
    </div>
  )
}
