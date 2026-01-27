import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Card,
  CardBlock,
  Heading,
  Paragraph,
  Search as SearchComponent,
  Tag,
  Spinner,
} from '@digdir/designsystemet-react'

import type { SearchResultItem } from '../api/search'
import { searchApi } from '../api/search'

function ResultCard({ item }: { item: SearchResultItem }) {
  return (
    <Link 
      to={`/info/${item.id}`} 
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Card style={{ cursor: 'pointer' }}>
        <CardBlock style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
          <Heading level={3} data-size='md' style={{ margin: 0 }}>
            {item.title}
          </Heading>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Tag variant='outline'>{item.info_type}</Tag>
            {item.score && (
              <Tag variant='outline'>Score: {item.score.toFixed(2)}</Tag>
            )}
          </div>

          {item.explanation && (
            <Paragraph data-size='sm' style={{ color: '#666', margin: 0 }}>
              {item.explanation}
            </Paragraph>
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
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <form onSubmit={handleSubmit}>
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
