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
          label: effectiveSearchQuery,
          href: `/search?query=${encodeURIComponent(effectiveSearchQuery)}`,
          icon: <MagnifyingGlassIcon style={{ width: '18px', height: '18px' }} />
        },
        { label: content?.title || 'Laster...', href: '#' }
      ]
    : []

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
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
        <div className="flex justify-center py-10">
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
