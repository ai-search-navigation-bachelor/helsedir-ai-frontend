import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiArrowLeft } from 'react-icons/fi'
import { MagnifyingGlassIcon } from '@navikt/aksel-icons'
import DOMPurify from 'dompurify'
import { Button, Alert, Paragraph, Spinner, Heading } from '@digdir/designsystemet-react'
import { getContentApi } from '../api/search'
import { fetchHelsedirContent, type HelselinkContent } from '../api/helsedir'
import type { ContentDetail as ContentDetailType } from '../api/types'
import { useSearchStore } from '../stores/searchStore'

type TableOfContentsItem = {
  id: string
  text: string
}

function extractH2Headings(html: string): TableOfContentsItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const h2Elements = doc.querySelectorAll('h2')
  
  return Array.from(h2Elements).map((h2, index) => ({
    id: `heading-${index}`,
    text: h2.textContent || '',
  }))
}

function addIdsToH2Elements(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const h2Elements = doc.querySelectorAll('h2')
  
  h2Elements.forEach((h2, index) => {
    h2.id = `heading-${index}`
  })
  
  return doc.body.innerHTML
}

function TableOfContents({ items }: { items: TableOfContentsItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -35% 0px' }
    )

    items.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav
      style={{
        position: 'sticky',
        top: '20px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Heading level={3} data-size='xs' style={{ marginBottom: '12px' }}>
        På denne siden
      </Heading>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '8px' }}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
              style={{
                display: 'block',
                padding: '8px 12px',
                textDecoration: 'none',
                color: activeId === item.id ? '#0051be' : '#333',
                backgroundColor: activeId === item.id ? '#d4e7f7' : 'transparent',
                borderRadius: '4px',
                borderLeft: activeId === item.id ? '3px solid #0051be' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: activeId === item.id ? 600 : 400,
                transition: 'all 0.2s ease',
                boxShadow: activeId === item.id ? '0 0 0 3px rgba(0, 81, 190, 0.1)' : 'none',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ContentDisplay({ content }: { content: ContentDetailType }) {
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set())
  
  const tocItems = useMemo(() => {
    return content.body ? extractH2Headings(content.body) : []
  }, [content.body])

  const processedHtml = useMemo(() => {
    if (!content.body) return ''
    const htmlWithIds = addIdsToH2Elements(content.body)
    return DOMPurify.sanitize(htmlWithIds)
  }, [content.body])

  // Get children (barn) links
  const childrenLinks = content.links?.filter(link => link.rel === 'barn') || []

  // Fetch child content for expanded items
  const { data: childrenData } = useQuery<Record<number, HelselinkContent>>({
    queryKey: ['children-content', content.id, Array.from(expandedChildren)],
    queryFn: async ({ signal }) => {
      const results: Record<number, HelselinkContent> = {}
      for (const idx of expandedChildren) {
        const link = childrenLinks[idx]
        if (link?.href) {
          try {
            results[idx] = await fetchHelsedirContent(link.href, signal)
          } catch (error) {
            console.error(`Failed to fetch child ${idx}:`, error)
          }
        }
      }
      return results
    },
    enabled: expandedChildren.size > 0,
    staleTime: 10 * 60 * 1000,
  })

  const toggleChild = (idx: number) => {
    setExpandedChildren(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  // Capitalize content type for display
  const displayType = content.content_type 
    ? content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)
    : 'Innhold'

  return (
    <div>
      {/* Title and type */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {displayType}
          </span>
        </div>
        <Heading level={1} data-size='xl' style={{ marginBottom: '20px', fontSize: '48px', fontWeight: 700 }}>
          {content.title}
        </Heading>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: tocItems.length > 0 ? '250px 1fr' : '1fr',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Left column - Table of Contents */}
        {tocItems.length > 0 && <TableOfContents items={tocItems} />}

        {/* Right column - Main content */}
        <div>
          {processedHtml && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#333',
              }}
              className="content-html"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          )}

          {/* Children sections */}
          {childrenLinks.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <Heading level={2} data-size='md' style={{ marginBottom: '24px' }}>
                Innhold
              </Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {childrenLinks.map((link, idx) => {
                  const isExpanded = expandedChildren.has(idx)
                  const childContent = childrenData?.[idx]

                  return (
                    <div 
                      key={idx}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Child header - clickable */}
                      <button
                        onClick={() => toggleChild(idx)}
                        style={{
                          width: '100%',
                          padding: '20px',
                          backgroundColor: isExpanded ? '#f0f9ff' : 'white',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8fafc'
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'white'
                        }}
                      >
                        <div>
                          <Heading level={3} data-size='sm' style={{ margin: 0, marginBottom: '4px' }}>
                            {link.tittel || 'Uten tittel'}
                          </Heading>
                          <p style={{ 
                            fontSize: '14px', 
                            color: '#64748b', 
                            margin: 0,
                            textTransform: 'capitalize'
                          }}>
                            {link.type || 'kapittel'}
                          </p>
                        </div>
                        <span style={{ 
                          fontSize: '24px', 
                          color: '#64748b',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}>
                          ▼
                        </span>
                      </button>

                      {/* Child content - expandable */}
                      {isExpanded && (
                        <div style={{ 
                          padding: '24px',
                          backgroundColor: '#fafafa',
                          borderTop: '1px solid #e2e8f0'
                        }}>
                          {!childContent && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                              <Spinner aria-label="Laster innhold..." />
                            </div>
                          )}
                          
                          {childContent && (
                            <div>
                              {childContent.intro && (
                                <Paragraph 
                                  data-size='md'
                                  style={{
                                    color: '#555',
                                    marginBottom: '20px',
                                    fontWeight: 500,
                                  }}
                                >
                                  {childContent.intro}
                                </Paragraph>
                              )}
                              
                              {childContent.tekst && (
                                <div
                                  style={{
                                    fontSize: '16px',
                                    lineHeight: '1.7',
                                    color: '#333',
                                  }}
                                  className="content-html"
                                  dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(childContent.tekst) 
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Breadcrumbs */}
      {effectiveSearchQuery && (
        <nav style={{ marginBottom: '24px' }}>
          <ol style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            fontSize: '14px',
            color: '#64748b'
          }}>
            <li>
              <Link 
                to="/"
                style={{ 
                  color: '#2563eb', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Forside
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link 
                to={`/search?query=${encodeURIComponent(effectiveSearchQuery)}`}
                style={{ 
                  color: '#2563eb', 
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                <MagnifyingGlassIcon style={{ width: '16px', height: '16px' }} />
                {effectiveSearchQuery.toUpperCase()}
              </Link>
            </li>
            {category && (
              <>
                <li>/</li>
                <li>
                  <Link 
                    to={`/category?query=${encodeURIComponent(effectiveSearchQuery)}&category=${encodeURIComponent(category)}&search_id=${effectiveSearchId || ''}`}
                    style={{ 
                      color: '#2563eb', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Link>
                </li>
              </>
            )}
            <li style={{ color: '#0f172a', fontWeight: '500' }}>
              - {content?.title || 'Laster...'}
            </li>
          </ol>
        </nav>
      )}

      {/* Back button if no breadcrumbs */}
      {!effectiveSearchQuery && (
        <Button
          variant='tertiary'
          onClick={() => navigate(-1)}
          style={{ marginBottom: '24px' }}
        >
          <FiArrowLeft size={20} />
          Tilbake
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
