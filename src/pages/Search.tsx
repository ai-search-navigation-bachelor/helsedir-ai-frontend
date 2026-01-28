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

import { useCategorizedSearchQuery } from '../hooks/queries/useCategorizedSearchQuery'
import type { CategoryGroup, CategoryResult } from '../api/categorized'

// Priority categories (temaside, nasjonal faglig retningslinje) - not clickable
const PRIORITY_CATEGORIES = ['temaside', 'nasjonal_faglig_retningslinje']

function CategoryCard({ 
  category,
  searchQuery,
  searchId
}: { 
  category: CategoryGroup
  searchQuery: string
  searchId?: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  
  const isPriority = PRIORITY_CATEGORIES.includes(category.category)
  const canNavigateToCategory = !isPriority && category.count > 0 && searchId
  
  // All categories: show 1 result initially, 5 when expanded
  const displayResults = !isExpanded 
    ? category.results.slice(0, 1)
    : category.results.slice(0, 5)
  
  const hasMore = category.results.length > 1
  const canShowLess = isExpanded && category.results.length > 5

  function handleCategoryClick() {
    if (canNavigateToCategory) {
      navigate(`/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category.category)}&search_id=${searchId}`)
    }
  }

  return (
    <Card style={{ cursor: canNavigateToCategory ? 'pointer' : 'default' }}>
      <CardBlock style={{ padding: '1.5rem' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            cursor: canNavigateToCategory ? 'pointer' : 'default'
          }}
          onClick={canNavigateToCategory ? handleCategoryClick : undefined}
        >
          <Heading level={2} data-size='md' style={{ margin: 0 }}>
            {category.display_name}
            {canNavigateToCategory && ' →'}
          </Heading>
          <Tag variant='outline' data-size='sm'>
            {category.count} {category.count === 1 ? 'treff' : 'treff'}
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
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded 
              ? (canShowLess ? `Vis færre` : 'Vis færre')
              : `Vis flere (${Math.min(4, category.results.length - 1)} til)`}
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

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('searchquery') || ''
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync input with URL parameter when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: !!searchQuery.trim(),
  })

  // Always create a mock "Tema side" category as first
  const mockTemaside: CategoryGroup = {
    category: 'temaside',
    display_name: 'Tema side',
    count: 0,
    is_priority: false,
    results: []
  }

  // Get top 4 categories from API response (priority categories + top other categories)
  const apiCategories = [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || []),
  ].slice(0, 4)

  // Combine mock temaside with 4 API categories to always show exactly 5 boxes
  const displayCategories = [mockTemaside, ...apiCategories]

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
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Heading level={1} data-size='lg' style={{ margin: 0 }}>
              Søkeresultater
            </Heading>
            <Tag variant='outline'>
              Totalt {data.total} {data.total === 1 ? 'treff' : 'treff'}
            </Tag>
          </div>

          {displayCategories.length === 0 || data.total === 0 ? (
            <Card>
              <CardBlock style={{ padding: '2rem', textAlign: 'center' }}>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Ingen resultater funnet for "{searchQuery}"
                </Paragraph>
              </CardBlock>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {displayCategories.map((category) => (
                <CategoryCard
                  key={category.category}
                  category={category}
                  searchQuery={searchQuery}
                  searchId={data.search_id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
