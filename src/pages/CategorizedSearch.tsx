import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
import type { CategoryGroup } from '../api/categorized'
import { getContentApi } from '../api/search'
import type { ContentDetail } from '../api/types'

// Special category handling
const TEMASIDE_CATEGORY = 'temaside'
const RETNINGSLINJE_CATEGORY = 'retningslinje'

function TemaSideCard({ 
  category
}: { 
  category: CategoryGroup
  searchQuery: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Show first result initially, 3 more when expanded
  const firstResult = category.results[0]
  const expandedResults = category.results.slice(1, 4)
  const hasMore = category.results.length > 1

  if (!firstResult) return null

  return (
    <Card style={{ border: '3px solid #0062BA' }}>
      <CardBlock style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Tag variant='outline' data-size='sm' style={{ marginBottom: '0.5rem' }}>
            {category.count} {category.count === 1 ? 'artikkel' : 'artikler'}
          </Tag>
        </div>

        {/* First temaside - clickable */}
        <Link 
          to={`/info/${firstResult.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ cursor: 'pointer' }}>
            <Heading level={2} data-size='lg' style={{ margin: 0, marginBottom: '0.25rem' }}>
              {firstResult.title}
            </Heading>
            <Paragraph data-size='sm' style={{ color: '#666', margin: 0 }}>
              Temaside
            </Paragraph>
          </div>
        </Link>

        {hasMore && (
          <>
            <div style={{ 
              margin: '1rem 0',
              borderTop: '1px solid #E6E6E6',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Button
                variant='tertiary'
                data-size='sm'
                onClick={() => setIsExpanded(!isExpanded)}
              >
                Vis {isExpanded ? 'færre' : 'flere'} {isExpanded ? '↑' : '↓'}
              </Button>
            </div>

            {isExpanded && (
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {expandedResults.map((result) => (
                  <Link 
                    key={result.id}
                    to={`/info/${result.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card style={{ cursor: 'pointer', backgroundColor: '#f9f9f9' }}>
                      <CardBlock style={{ padding: '1rem' }}>
                        <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '0.25rem' }}>
                          {result.title}
                        </Heading>
                        <Paragraph data-size='xs' style={{ color: '#666', margin: 0 }}>
                          Temaside
                        </Paragraph>
                      </CardBlock>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </CardBlock>
    </Card>
  )
}

function RetningslinjeCard({ 
  category
}: { 
  category: CategoryGroup
  searchQuery: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Show first 5 results
  const displayResults = category.results.slice(0, 5)

  return (
    <Card style={{ border: '3px solid #0062BA' }}>
      <CardBlock style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Tag variant='outline' data-size='sm' style={{ marginBottom: '0.5rem' }}>
            {category.count} {category.count === 1 ? 'artikkel' : 'artikler'}
          </Tag>
          <Heading level={2} data-size='lg' style={{ margin: 0, marginBottom: '0.25rem' }}>
            ADHD
          </Heading>
          <Paragraph data-size='sm' style={{ color: '#666', margin: 0 }}>
            Nasjonal faglig retningslinje
          </Paragraph>
        </div>

        {displayResults.length > 0 && (
          <>
            {/* Show collapsed or expanded view */}
            {!isExpanded ? (
              <>
                <div style={{ 
                  margin: '1rem 0',
                  borderTop: '1px solid #E6E6E6',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <Button
                    variant='tertiary'
                    data-size='sm'
                    onClick={() => setIsExpanded(true)}
                  >
                    Vis flere ↓
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ 
                  margin: '1rem 0',
                  borderTop: '1px solid #E6E6E6',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <Button
                    variant='tertiary'
                    data-size='sm'
                    onClick={() => setIsExpanded(false)}
                  >
                    Vis færre ↑
                  </Button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {displayResults.map((result) => (
                    <Link 
                      key={result.id}
                      to={`/info/${result.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card style={{ cursor: 'pointer', backgroundColor: '#f9f9f9' }}>
                        <CardBlock style={{ padding: '1rem' }}>
                          <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '0.25rem' }}>
                            {result.title}
                          </Heading>
                          <Paragraph data-size='xs' style={{ color: '#999', margin: 0 }}>
                            Hentet fra: Dette er et utdrag fra innholdet.
                          </Paragraph>
                        </CardBlock>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardBlock>
    </Card>
  )
}

// Component to display a single result with content data
function ResultWithContent({ 
  resultId, 
  resultTitle,
  searchId 
}: { 
  resultId: string
  resultTitle: string
  searchId?: string 
}) {
  const { data: content } = useQuery<ContentDetail, Error>({
    queryKey: ['content', resultId],
    queryFn: async () => getContentApi(resultId, searchId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Find the root link
  const rootLink = content?.links?.find(link => link.rel === 'root')

  return (
    <Link 
      to={`/info/${resultId}?search_id=${searchId}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card style={{ cursor: 'pointer', backgroundColor: '#fff' }}>
        <CardBlock style={{ padding: '1rem' }}>
          <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '0.25rem', color: '#0062BA' }}>
            {resultTitle} →
          </Heading>
          <Paragraph data-size='xs' style={{ color: '#666', margin: 0 }}>
            {rootLink ? (
              <>Hentet fra: {rootLink.tittel}</>
            ) : (
              <>Dette er et utdrag fra innholdet.</>
            )}
          </Paragraph>
        </CardBlock>
      </Card>
    </Link>
  )
}

function RegularCategoryCard({ 
  category,
  searchQuery,
  searchId
}: { 
  category: CategoryGroup
  searchQuery: string
  searchId?: string
}) {
  const navigate = useNavigate()
  
  // Show top 3 results
  const displayResults = category.results.slice(0, 3)
  const totalResults = category.count

  function handleHeaderClick() {
    if (searchId) {
      navigate(`/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category.category)}&search_id=${searchId}`)
    }
  }

  return (
    <div style={{ 
      border: '1px solid #E6E6E6',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }}>
      {/* Header - clickable */}
      <div 
        style={{ 
          padding: '1.5rem',
          cursor: 'pointer',
          borderBottom: '1px solid #E6E6E6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff'
        }}
        onClick={handleHeaderClick}
      >
        <Heading level={2} data-size='md' style={{ margin: 0 }}>
          {category.display_name} →
        </Heading>
        <Tag variant='outline' data-size='sm'>
          {totalResults} treff
        </Tag>
      </div>

      {/* Top 3 results */}
      {displayResults.length > 0 && (
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {displayResults.map((result) => (
              <ResultWithContent
                key={result.id}
                resultId={result.id}
                resultTitle={result.title}
                searchId={searchId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
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

  // Separate categories by type
  const temasideCategory = data?.priority_categories.find(cat => cat.category === TEMASIDE_CATEGORY) ||
    data?.other_categories.find(cat => cat.category === TEMASIDE_CATEGORY)
  
  const retningslinjeCategory = data?.priority_categories.find(cat => cat.category === RETNINGSLINJE_CATEGORY) ||
    data?.other_categories.find(cat => cat.category === RETNINGSLINJE_CATEGORY)
  
  // Get other categories (excluding temaside and retningslinje)
  const otherCategories = [
    ...(data?.priority_categories || []),
    ...(data?.other_categories || []),
  ].filter(cat => 
    cat.category !== TEMASIDE_CATEGORY && 
    cat.category !== RETNINGSLINJE_CATEGORY &&
    cat.results.length > 0
  )

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
            <Heading level={1} data-size='xl' style={{ margin: 0 }}>
              {searchQuery.toUpperCase()}
            </Heading>
          </div>

          <Paragraph data-size='md' style={{ color: '#666', margin: 0 }}>
            {data.total} treff på {searchQuery.toUpperCase()}
          </Paragraph>

          {data.total === 0 ? (
            <Card>
              <CardBlock style={{ padding: '2rem', textAlign: 'center' }}>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Ingen resultater funnet for "{searchQuery}"
                </Paragraph>
              </CardBlock>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Temaside - always first */}
              {temasideCategory && temasideCategory.results.length > 0 && (
                <TemaSideCard
                  category={temasideCategory}
                  searchQuery={searchQuery}
                />
              )}

              {/* Retningslinje - always second */}
              {retningslinjeCategory && retningslinjeCategory.results.length > 0 && (
                <RetningslinjeCard
                  category={retningslinjeCategory}
                  searchQuery={searchQuery}
                />
              )}

              {/* Other categories */}
              {otherCategories.map((category) => (
                <RegularCategoryCard
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
