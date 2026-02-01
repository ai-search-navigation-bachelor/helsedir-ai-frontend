import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'
import { Button, Alert, Spinner, Paragraph } from '@digdir/designsystemet-react'
import { getContentApi } from '../api/search'
import { useSearchStore } from '../stores/searchStore'
import { ContentDisplay } from '../components/content'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import type { BreadcrumbItem } from '../types/components'

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const searchId = useSearchStore((state) => state.searchId)
  const searchQuery = useSearchStore((state) => state.searchQuery)

  const effectiveSearchId = searchId || undefined
  const effectiveSearchQuery = searchQuery || ''

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['content', id, effectiveSearchId],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('ID mangler')
      return getContentApi(id, effectiveSearchId, { signal })
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })

  const breadcrumbItems: BreadcrumbItem[] = effectiveSearchQuery
    ? [
        { label: 'Forside', href: '/' },
        {
          label: effectiveSearchQuery.toUpperCase(),
          href: `/search?query=${encodeURIComponent(effectiveSearchQuery)}`,
          icon: <MagnifyingGlassIcon style={{ width: '16px', height: '16px' }} />
        },
        { label: content?.title || 'Laster...', href: '#' }
      ]
    : []

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {effectiveSearchQuery ? (
        <Breadcrumb items={breadcrumbItems} />
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner aria-label="Laster innhold..." />
        </div>
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
