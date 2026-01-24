import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Card,
  CardBlock,
  Details,
  Heading,
  Paragraph,
  Search as SearchComponent,
  Tag,
  Spinner,
} from '@digdir/designsystemet-react'

import type { SearchResultItem } from '../api/search'
import { searchApi } from '../api/search'

function htmlToText(value: string): string {
  if (!value) return ''
  try {
    const doc = new DOMParser().parseFromString(value, 'text/html')
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
  } catch {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function parseKoder(value: string | null | undefined): Record<string, string[]> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>
      const out: Record<string, string[]> = {}
      for (const [key, v] of Object.entries(record)) {
        if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
          out[key] = v as string[]
        }
      }
      return Object.keys(out).length > 0 ? out : null
    }
    return null
  } catch {
    return null
  }
}

function ResultCard({ item }: { item: SearchResultItem }) {
  const preview = item.tekst ? htmlToText(item.tekst) : ''
  const koder = parseKoder(item.koder)

  return (
    <Link 
      to={`/info/${item.id}`} 
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Card style={{ cursor: 'pointer' }}>
        <CardBlock style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
          <Heading level={3} data-size='md' style={{ margin: 0 }}>
            {item.tittel}
          </Heading>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.infoType && <Tag variant='outline'>{item.infoType}</Tag>}
            {koder &&
              Object.entries(koder).flatMap(([key, values]) =>
                values.map((v) => (
                  <Tag key={`${item.id}-${key}-${v}`} variant='outline'>
                    {key}: {v}
                  </Tag>
                )),
              )}
          </div>

          {preview && (
            <Details onClick={(e) => e.stopPropagation()}>
              <Details.Summary>Vis tekst</Details.Summary>
              <Details.Content>
                <Paragraph style={{ margin: 0 }}>{preview}</Paragraph>
              </Details.Content>
            </Details>
          )}
        </CardBlock>
      </Card>
    </Link>
  )
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('searchquery') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async ({ signal }) => {
      if (!searchQuery.trim()) {
        return { results: [] }
      }
      return searchApi(searchQuery, { signal })
    },
    enabled: !!searchQuery.trim(),
    staleTime: 5 * 60 * 1000, // Cache i 5 minutter
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const newQuery = formData.get('query') as string
    if (newQuery.trim()) {
      setSearchParams({ searchquery: newQuery.trim() })
    }
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <form onSubmit={handleSubmit}>
        <SearchComponent>
          <SearchComponent.Input
            name="query"
            aria-label='Søk'
            placeholder='Søk etter innhold…'
            value={searchQuery}
            onChange={(e) => setSearchParams({ searchquery: e.target.value }, { replace: true })}
          />
          <SearchComponent.Clear
            aria-label='Tøm'
            onClick={(e) => {
              e.preventDefault()
              navigate('/search')
            }}
          />
          <SearchComponent.Button type='submit' variant='secondary'>
            Søk
          </SearchComponent.Button>
        </SearchComponent>
      </form>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner aria-label="Søker..." />
        </div>
      )}

      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Søket feilet'}
          </Paragraph>
        </Alert>
      )}

      {data && !isLoading && !error && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Paragraph data-size='sm' style={{ margin: 0 }}>
            Treff: {data.results.length}
          </Paragraph>
          {data.results.length === 0 ? (
            <Paragraph style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Ingen resultater funnet for "{searchQuery}"
            </Paragraph>
          ) : (
            data.results.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
