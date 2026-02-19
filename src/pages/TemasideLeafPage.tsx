import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { ContentDisplay } from '../components/content'
import { TemasideHubStatusView } from '../components/content/temaside'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useContentByIdQuery } from '../hooks/queries/useContentByIdQuery'
import { useTemasideHubPageModel } from '../hooks/useTemasideHubPageModel'
import type { TemasideCategorySlug } from '../constants/temasider'

interface TemasideLeafPageProps {
  categorySlug: TemasideCategorySlug
}

export function TemasideLeafPage({ categorySlug }: TemasideLeafPageProps) {
  const navigate = useNavigate()

  const {
    breadcrumbItems,
    category,
    contentId,
    error,
    isError,
    isHub,
    isLoading,
    node,
    temaPath,
  } = useTemasideHubPageModel(categorySlug)

  // Intermediate nodes have children but are not the root hub → redirect to hub
  useEffect(() => {
    if (!isLoading && node && isHub) {
      navigate(`/${categorySlug}`, { replace: true })
    }
  }, [categorySlug, isHub, isLoading, navigate, node])

  const isLeafNode = Boolean(node && !isHub && contentId)

  const {
    data: leafContent,
    isLoading: isLeafLoading,
    error: leafError,
  } = useContentByIdQuery({ contentId, enabled: isLeafNode })

  if (!category) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        details={<>Ukjent kategori for: <code>{temaPath}</code></>}
      />
    )
  }

  if (isLoading) {
    return <TemasideHubStatusView title="Laster temasider..." breadcrumbItems={breadcrumbItems} />
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

  // Intermediate node — useEffect redirect is in flight
  if (isHub) return null

  return (
    <div className="max-w-screen-xl mx-auto px-12 pt-2 pb-8 lg:pb-10">
      <Breadcrumb items={breadcrumbItems} />

      {isLeafLoading && (
        <div className="flex justify-center items-center py-8">
          <Spinner aria-label="Laster temaside..." data-size="lg" />
        </div>
      )}

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
