import { type ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@digdir/designsystemet-react'
import { useSearchStore } from '../../stores/searchStore'
import { useContentDetailBreadcrumbs } from '../../hooks/useContentDetailBreadcrumbs'
import { Breadcrumb } from '../ui/Breadcrumb'
import { ContentPageLoadingSkeleton } from './ContentSkeletons'
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
  const navigate = useNavigate()
  const searchId = useSearchStore((s) => s.searchId) || undefined

  useEffect(() => {
    let meta = document.querySelector('meta[name="content-id"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'content-id'
      document.head.appendChild(meta)
    }
    meta.content = content.id
    return () => { meta.remove() }
  }, [content.id])

  const { activeBreadcrumbItems, isParentChainLoading, collapsible } = useContentDetailBreadcrumbs({
    content,
    searchId,
  })

  if (isParentChainLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
        <ContentPageLoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12">
      {activeBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={activeBreadcrumbItems} collapsible={collapsible} />
      ) : (
        <Button variant="tertiary" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
          &larr; Tilbake
        </Button>
      )}
      {children}
    </div>
  )
}
