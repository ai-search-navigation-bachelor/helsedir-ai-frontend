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
  Spinner,
  Tag,
} from '@digdir/designsystemet-react'

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery'
import type { CategoryGroup, CategoryResult } from '../api/categorized'

// Map category names to Norwegian display names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'temaside': 'Tema side',
  'nasjonal_faglig_retningslinje': 'Nasjonal faglig retningslinje',
  'anbefalinger': 'Anbefalinger',
  'regelverk': 'Regelverk',
  'raad': 'Råd',
}

// Categories that support expand/collapse
const EXPANDABLE_CATEGORIES = ['temaside', 'nasjonal_faglig_retningslinje']

function CategoryCard({ 
  category, 
  displayName,
  isExpandable 
}: { 
  category: CategoryGroup
  displayName: string
  isExpandable: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Show top 3 results initially for expandable categories, all for others
  const displayResults = isExpandable && !isExpanded 
    ? category.results.slice(0, 3) 
    : category.results
  
  const hasMore = isExpandable && category.results.length > 3

  return (
    <Card>
      <CardBlock style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Heading level={2} data-size='md' style={{ margin: 0 }}>
            {displayName}
          </Heading>
          <Tag variant='info' data-size='sm'>
            {category.total_count} {category.total_count === 1 ? 'treff' : 'treff'}
          </Tag>
        </div>

        {displayResults.length === 0 ? (
          <Paragraph data-size='sm' style={{ color: '#666', margin: 0 }}>
            Ingen resultater
          </Paragraph>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {displayResults.map((result) => (
              <ResultItem key={result.id} result={result} />
            ))}
          </div>
        )}

        {hasMore && (
          <Button
            variant='tertiary'
            data-size='sm'
            style={{ marginTop: '1rem' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Vis færre' : `Vis flere (${category.results.length - 3} til)`}
          </Button>
        )}
      </CardBlock>
    </Card>
  )
}

function ResultItem({ result }: { result: CategoryResult }) {
  return (
    <Link 
      to={`/info/${result.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card style={{ cursor: 'pointer', backgroundColor: '#f9f9f9' }}>
        <CardBlock style={{ padding: '1rem' }}>
          <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '0.5rem' }}>
            {result.tittel}
          </Heading>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {result.infoType && (
              <Tag variant='outline' data-size='sm'>
                {result.infoType}
              </Tag>
            )}
            {result.score && (
              <Tag variant='neutral' data-size='sm'>
                Score: {result.score.toFixed(2)}
              </Tag>
            )}
          </div>

          {result.intro && (
            <Paragraph data-size='sm' style={{ marginTop: '0.5rem', marginBottom: 0, color: '#555' }}>
              {result.intro.length > 150 
                ? `${result.intro.substring(0, 150)}...` 
                : result.intro}
            </Paragraph>
          )}
        </CardBlock>
      </Card>
    </Link>
  )
}

export function CategorizedSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('query') || ''
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (trimmed) {
        next.set('query', trimmed)
      } else {
        next.delete('query')
      }
      return next
    })
  }

  // Combine all categories for display
  const allCategories = [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || []),
  ]

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
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
              navigate('/categorized')
            }}
          />
          <SearchComponent.Button type='submit' variant='secondary'>
            Søk
          </SearchComponent.Button>
        </SearchComponent>
      </form>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner aria-label="Søker..." data-size='lg' />
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
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Heading level={1} data-size='lg' style={{ margin: 0 }}>
              Søkeresultater
            </Heading>
            <Tag variant='info'>
              Totalt {data.total} {data.total === 1 ? 'treff' : 'treff'}
            </Tag>
          </div>

          {allCategories.length === 0 ? (
            <Card>
              <CardBlock style={{ padding: '2rem', textAlign: 'center' }}>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Ingen resultater funnet for "{searchQuery}"
                </Paragraph>
              </CardBlock>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {allCategories.map((category) => (
                <CategoryCard
                  key={category.category}
                  category={category}
                  displayName={CATEGORY_DISPLAY_NAMES[category.category] || category.category}
                  isExpandable={EXPANDABLE_CATEGORIES.includes(category.category)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
