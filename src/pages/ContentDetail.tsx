import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'
import { Button, Alert, Paragraph } from '@digdir/designsystemet-react'
import { getContent } from '../api'
import { useSearchStore } from '../stores/searchStore'
import { useTemasideBreadcrumbStore } from '../stores'
import { ContentDisplay } from '../components/content'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import type { BreadcrumbItem } from '../types/components'

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const searchId = useSearchStore((state) => state.searchId)
  const searchQuery = useSearchStore((state) => state.searchQuery)
  const temasideTrailByPath = useTemasideBreadcrumbStore((state) => state.trailByPath)
  const temasideLastPath = useTemasideBreadcrumbStore((state) => state.lastPath)

  const effectiveSearchId = searchId || undefined
  const effectiveSearchQuery = searchQuery || ''

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['content', id, effectiveSearchId],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('ID mangler')
      return getContent(id, effectiveSearchId, { signal })
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
  const temasideBreadcrumbItems: BreadcrumbItem[] =
    !effectiveSearchQuery && temasideLastPath && temasideTrailByPath[temasideLastPath]
      ? [
          ...temasideTrailByPath[temasideLastPath],
          { label: content?.title || 'Laster...', href: '#' },
        ]
      : []

  return (
    <div className="max-w-screen-xl mx-auto px-8 pt-4 pb-8">
      {effectiveSearchQuery ? (
        <Breadcrumb items={breadcrumbItems} />
      ) : temasideBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={temasideBreadcrumbItems} />
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
