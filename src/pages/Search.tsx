import { useState, useEffect } from 'react'
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
      className='search-page__link'
    >
      <Card className='search-page__card'>
        <CardBlock className='search-page__card-block'>
          <Heading level={3} data-size='md' style={{ margin: 0 }}>
            {item.tittel}
          </Heading>

          <div className='search-page__tags'>
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
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

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
    const trimmed = inputValue.trim()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (trimmed) {
        next.set('searchquery', trimmed)
      } else {
        next.delete('searchquery')
      }
      return next
    })
  }

  return (
    <div className='search-page'>
      <form onSubmit={handleSubmit} className='search-page__form'>
        <SearchComponent>
          <SearchComponent.Input
            name="query"
            aria-label='Søk'
            placeholder='Søk etter innhold…'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <SearchComponent.Clear
            aria-label='Tøm'
            onClick={(e) => {
              e.preventDefault()
              setInputValue('')
              navigate('/search')
            }}
          />
          <SearchComponent.Button type='submit' variant='secondary'>
            Søk
          </SearchComponent.Button>
        </SearchComponent>
      </form>

      {isLoading && (
        <div className='search-page__loading'>
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
        <div className='search-page__results'>
          <Paragraph data-size='sm' style={{ margin: 0 }}>
            Treff: {data.results.length}
          </Paragraph>
          {data.results.length === 0 ? (
            <Paragraph className='search-page__empty'>
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
