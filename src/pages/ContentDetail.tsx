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
  const [activeChapter, setActiveChapter] = useState<string>('')
  
  // Get children (barn) links
  const childrenLinks = content.links?.filter(link => link.rel === 'barn') || []

  // Fetch ALL child content immediately
  const { data: childrenData, isLoading: childrenLoading } = useQuery<Record<number, HelselinkContent>>({
    queryKey: ['children-content', content.id],
    queryFn: async ({ signal }) => {
      const results: Record<number, HelselinkContent> = {}
      for (let idx = 0; idx < childrenLinks.length; idx++) {
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
    enabled: childrenLinks.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  // Track active chapter with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -35% 0px' }
    )

    childrenLinks.forEach((_, idx) => {
      const element = document.getElementById(`chapter-${idx}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [childrenLinks.length])

  const scrollToChapter = (idx: number) => {
    const element = document.getElementById(`chapter-${idx}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

      {/* Two-column layout with chapters TOC */}
      {childrenLinks.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Left column - Chapters Table of Contents */}
          <nav
            style={{
              position: 'sticky',
              top: '20px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <Heading level={3} data-size='xs' style={{ marginBottom: '12px' }}>
              Kapitler
            </Heading>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {childrenLinks.map((link, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  <button
                    onClick={() => scrollToChapter(idx)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      textDecoration: 'none',
                      color: activeChapter === `chapter-${idx}` ? '#0051be' : '#333',
                      backgroundColor: activeChapter === `chapter-${idx}` ? '#d4e7f7' : 'transparent',
                      borderRadius: '4px',
                      borderLeft: activeChapter === `chapter-${idx}` ? '3px solid #0051be' : '3px solid transparent',
                      fontSize: '14px',
                      fontWeight: activeChapter === `chapter-${idx}` ? 600 : 400,
                      transition: 'all 0.2s ease',
                      boxShadow: activeChapter === `chapter-${idx}` ? '0 0 0 3px rgba(0, 81, 190, 0.1)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#64748b', minWidth: '20px' }}>
                        {idx + 1}.
                      </span>
                      <span>{link.tittel || 'Uten tittel'}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right column - Chapters content */}
          <div>
            {/* Main body content if exists */}
            {content.body && (
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  color: '#333',
                  marginBottom: '48px',
                }}
                className="content-html"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
              />
            )}

            {/* Loading state */}
            {childrenLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner aria-label="Laster kapitler..." />
              </div>
            )}

            {/* Chapters */}
            {!childrenLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {childrenLinks.map((link, idx) => {
                  const childContent = childrenData?.[idx]

                  return (
                    <div 
                      key={idx}
                      id={`chapter-${idx}`}
                      style={{
                        scrollMarginTop: '20px',
                      }}
                    >
                      {/* Chapter header */}
                      <div style={{
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ 
                            fontSize: '20px', 
                            fontWeight: '700',
                            color: '#2563eb'
                          }}>
                            {idx + 1}
                          </span>
                          <Heading level={2} data-size='lg' style={{ margin: 0 }}>
                            {link.tittel || 'Uten tittel'}
                          </Heading>
                        </div>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#64748b', 
                          margin: 0,
                          marginLeft: '32px',
                          textTransform: 'capitalize'
                        }}>
                          {link.type || 'kapittel'}
                        </p>
                      </div>

                      {/* Chapter content */}
                      {!childContent && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          Kunne ikke laste kapittel
                        </div>
                      )}
                      
                      {childContent && (
                        <div>
                          {childContent.intro && (
                            <Paragraph 
                              data-size='lg'
                              style={{
                                color: '#555',
                                marginBottom: '24px',
                                fontWeight: 500,
                                fontSize: '18px',
                                lineHeight: '1.6',
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
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // No chapters - show just the body content
        <div>
          {content.body && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#333',
              }}
              className="content-html"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          )}
        </div>
      )}
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
