import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardBlock,
  Heading,
  Paragraph,
  Search as SearchComponent,
  Tag,
  Spinner,
} from '@digdir/designsystemet-react'

import { useCategorySearchQuery } from '../hooks/queries/useCategorySearchQuery'
import type { CategorySearchResult } from '../api/categorySearch'

function ResultItem({ result }: { result: CategorySearchResult }) {
  return (
    <Link 
      to={`/info/${result.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card style={{ cursor: 'pointer', backgroundColor: '#f9f9f9' }}>
        <CardBlock style={{ padding: '1rem' }}>
          <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '0.5rem' }}>
            {result.title}
          </Heading>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <Tag variant='outline' data-size='sm'>
              {result.info_type}
            </Tag>
            <Tag variant='outline' data-size='sm'>
              Score: {result.score.toFixed(2)}
            </Tag>
          </div>

          {result.explanation && (
            <Paragraph data-size='sm' style={{ marginTop: '0.5rem', marginBottom: 0, color: '#555' }}>
              {result.explanation.length > 150 
                ? `${result.explanation.substring(0, 150)}...` 
                : result.explanation}
            </Paragraph>
          )}
        </CardBlock>
      </Card>
    </Link>
  )
}

export function CategoryResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const searchQuery = searchParams.get('query') || ''
  const category = searchParams.get('category') || ''
  const searchId = searchParams.get('search_id') || ''
  
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const { data, isLoading, error } = useCategorySearchQuery(searchQuery, category, {
    search_id: searchId,
    enabled: !!searchQuery.trim() && !!category && !!searchId,
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      navigate(`/search?searchquery=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleBack() {
    navigate(`/search?searchquery=${encodeURIComponent(searchQuery)}`)
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

      <Button
        variant='tertiary'
        onClick={handleBack}
        style={{ width: 'fit-content' }}
      >
        ← Tilbake til søkeresultater
      </Button>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner aria-label="Laster..." />
        </div>
      )}

      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Kunne ikke laste resultater'}
          </Paragraph>
        </Alert>
      )}

      {data && !isLoading && !error && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Heading level={1} data-size='lg' style={{ margin: 0 }}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Heading>
            <Tag variant='outline'>
              {data.total} {data.total === 1 ? 'treff' : 'treff'}
            </Tag>
          </div>

          {data.results.length === 0 ? (
            <Card>
              <CardBlock style={{ padding: '2rem', textAlign: 'center' }}>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Ingen resultater funnet
                </Paragraph>
              </CardBlock>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {data.results.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
