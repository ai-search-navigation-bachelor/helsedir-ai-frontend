import type { ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@digdir/designsystemet-react'
import { useSearchStore } from '../../stores/searchStore'
import { useContentDetailBreadcrumbs } from '../../hooks/useContentDetailBreadcrumbs'
import { Breadcrumb } from '../ui/Breadcrumb'
import type { ContentDetail } from '../../types'

interface ContentPageLayoutProps {
  content: ContentDetail
  children: ReactNode
}

/**
 * Shared wrapper for all content detail pages.
 * Handles the page container, breadcrumb trail and fallback back-button.
 */
export function ContentPageLayout({ content, children }: ContentPageLayoutProps) {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const searchId = useSearchStore((s) => s.searchId) || undefined

  const { activeBreadcrumbItems } = useContentDetailBreadcrumbs({
    content,
    currentContentId: id,
    locationState: location.state,
    searchId,
  })

  return (
    <div className="max-w-screen-xl mx-auto px-12 pt-4 pb-8">
      {activeBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={activeBreadcrumbItems} />
      ) : (
        <Button variant="tertiary" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
          &larr; Tilbake
        </Button>
      )}
      {children}
    </div>
  )
}
