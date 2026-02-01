import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const searchId = searchParams.get('search_id')
  const searchQuery = searchParams.get('query')
  const category = searchParams.get('category')
  
  const storedSearchId = useSearchStore((state) => state.searchId)
  const storedSearchQuery = useSearchStore((state) => state.searchQuery)
  
  const effectiveSearchId = searchId || storedSearchId || undefined
  const effectiveSearchQuery = searchQuery || storedSearchQuery || ''

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
        ...(category ? [{
          label: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          href: `/category?query=${encodeURIComponent(effectiveSearchQuery)}&category=${encodeURIComponent(category)}&search_id=${effectiveSearchId || ''}`
        }] : []),
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
