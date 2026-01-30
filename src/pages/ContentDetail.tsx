import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import DOMPurify from 'dompurify'
import { Button, Alert, Spinner, Heading, Paragraph } from '@digdir/designsystemet-react'
import { getContentApi } from '../api/search'
import { fetchChapterWithSubchapters, type ChapterWithSubchapters } from '../api/helsedir'
import type { ContentDetail as ContentDetailType } from '../api/types'
import { useSearchStore } from '../stores/searchStore'

function ContentDisplay({ content }: { content: ContentDetailType }) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [expandedSubchapters, setExpandedSubchapters] = useState<Set<string>>(new Set())
  const [activeChapter, setActiveChapter] = useState<string | null>(null)
  
  // Get children (barn) links
  const childrenLinks = content.links?.filter(link => link.rel === 'barn') || []

  // Fetch chapters with their subchapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery<Record<number, ChapterWithSubchapters>>({
    queryKey: ['chapters-content', content.id],
    queryFn: async ({ signal }) => {
      const results: Record<number, ChapterWithSubchapters> = {}
      for (let idx = 0; idx < childrenLinks.length; idx++) {
        const link = childrenLinks[idx]
        if (link?.href) {
          try {
            results[idx] = await fetchChapterWithSubchapters(link.href, signal)
          } catch (error) {
            // Ignore AbortErrors (expected when navigating away)
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error(`Failed to fetch chapter ${idx}:`, error)
            }
          }
        }
      }
      return results
    },
    enabled: childrenLinks.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  const toggleChapter = (idx: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  const toggleSubchapter = (key: string) => {
    setExpandedSubchapters(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Set up intersection observer to track visible chapters
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible entry
        let mostVisible = null
        let maxRatio = 0
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisible = entry.target.id
          }
        })
        
        if (mostVisible) {
          setActiveChapter(mostVisible)
        }
      },
      { rootMargin: '0px 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    // Observe all chapters and subchapters
    childrenLinks.forEach((_, idx) => {
      const element = document.getElementById(`chapter-${idx}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [childrenLinks])

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

      {/* Two-column layout with TOC and chapters */}
      {childrenLinks.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Left column - Table of Contents */}
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
              {childrenLinks.map((link, idx) => {
                const chapter = chaptersData?.[idx]
                const isExpanded = expandedChapters.has(idx)
                const isActive = activeChapter === `chapter-${idx}`
                
                return (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => {
                        // Scroll to chapter and expand it if collapsed
                        const element = document.getElementById(`chapter-${idx}`)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                        if (!isExpanded) {
                          toggleChapter(idx)
                        }
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        color: isActive ? '#0051be' : '#333',
                        backgroundColor: isActive ? '#d4e7f7' : 'transparent',
                        borderRadius: '4px',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderLeft: isActive ? '3px solid #0051be' : '3px solid transparent',
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 0 0 3px rgba(0, 81, 190, 0.1)' : 'none',
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
                    
                    {/* Show subchapters in TOC if chapter is expanded */}
                    {isExpanded && chapter?.subchapters && chapter.subchapters.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: '0 0 0 32px', margin: '4px 0 0 0' }}>
                        {chapter.subchapters.map((sub, subIdx) => {
                          const subKey = `${idx}-${subIdx}`
                          const isSubActive = activeChapter === `subchapter-${subKey}`
                          
                          return (
                            <li key={subKey} style={{ marginBottom: '4px' }}>
                              <button
                                onClick={() => {
                                  const element = document.getElementById(`subchapter-${subKey}`)
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  }
                                  if (!expandedSubchapters.has(subKey)) {
                                    toggleSubchapter(subKey)
                                  }
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '6px 8px',
                                  textAlign: 'left',
                                  color: isSubActive ? '#0051be' : '#64748b',
                                  backgroundColor: 'transparent',
                                  borderTop: 'none',
                                  borderRight: 'none',
                                  borderBottom: 'none',
                                  borderLeft: 'none',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  fontWeight: isSubActive ? 600 : 400,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <span style={{ fontWeight: '600', minWidth: '30px' }}>
                                    {idx + 1}.{subIdx + 1}
                                  </span>
                                  <span>{sub.tittel || 'Uten tittel'}</span>
                                </div>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Right column - Content */}
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
            {chaptersLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner aria-label="Laster kapitler..." />
              </div>
            )}

            {/* Chapters accordion */}
            {!chaptersLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {childrenLinks.map((link, chapterIdx) => {
                const chapter = chaptersData?.[chapterIdx]
                const isExpanded = expandedChapters.has(chapterIdx)

                return (
                  <div 
                    key={chapterIdx}
                    id={`chapter-${chapterIdx}`}
                    style={{
                      border: '2px solid #cbd5e1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      scrollMarginTop: '20px',
                    }}
                  >
                    {/* Chapter header button */}
                    <button
                      onClick={() => toggleChapter(chapterIdx)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isExpanded ? '#f0f9ff' : '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '18px', 
                          fontWeight: '700',
                          color: '#2563eb',
                          minWidth: '30px',
                        }}>
                          {chapterIdx + 1}.
                        </span>
                        <span style={{ 
                          fontSize: '18px', 
                          fontWeight: '600',
                          color: '#1e293b',
                          textAlign: 'left',
                        }}>
                          {link.tittel || 'Uten tittel'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                      ) : (
                        <ChevronRightIcon style={{ width: '24px', height: '24px', color: '#64748b' }} />
                      )}
                    </button>

                    {/* Expanded chapter content */}
                    {isExpanded && chapter && (
                      <div style={{ 
                        padding: '24px',
                        backgroundColor: '#fafafa',
                        borderTop: '2px solid #cbd5e1',
                      }}>
                        {/* Chapter intro and tekst */}
                        {chapter.intro && (
                          <div style={{
                            fontSize: '16px',
                            lineHeight: '1.7',
                            color: '#555',
                            marginBottom: '20px',
                            fontWeight: 500,
                          }}>
                            {chapter.intro}
                          </div>
                        )}
                        
                        {chapter.tekst && (
                          <div
                            style={{
                              fontSize: '16px',
                              lineHeight: '1.7',
                              color: '#333',
                              marginBottom: chapter.subchapters && chapter.subchapters.length > 0 ? '24px' : '0',
                            }}
                            className="content-html"
                            dangerouslySetInnerHTML={{ 
                              __html: DOMPurify.sanitize(chapter.tekst) 
                            }}
                          />
                        )}

                        {/* Subchapters */}
                        {chapter.subchapters && chapter.subchapters.length > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px',
                            marginTop: '24px',
                          }}>
                            {chapter.subchapters.map((subchapter, subIdx) => {
                              const subKey = `${chapterIdx}-${subIdx}`
                              const isSubExpanded = expandedSubchapters.has(subKey)

                              return (
                                <div
                                  key={subKey}
                                  id={`subchapter-${subKey}`}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    backgroundColor: '#ffffff',
                                    scrollMarginTop: '20px',
                                  }}
                                >
                                  {/* Subchapter header button */}
                                  <button
                                    onClick={() => toggleSubchapter(subKey)}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: isSubExpanded ? '#f0f9ff' : '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSubExpanded) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSubExpanded) {
                                        e.currentTarget.style.backgroundColor = '#ffffff'
                                      }
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ 
                                        fontSize: '15px', 
                                        fontWeight: '600',
                                        color: '#2563eb',
                                        minWidth: '40px',
                                      }}>
                                        {chapterIdx + 1}.{subIdx + 1}
                                      </span>
                                      <span style={{ 
                                        fontSize: '15px', 
                                        fontWeight: '500',
                                        color: '#334155',
                                        textAlign: 'left',
                                      }}>
                                        {subchapter.tittel || 'Uten tittel'}
                                      </span>
                                    </div>
                                    {isSubExpanded ? (
                                      <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                                    ) : (
                                      <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748b' }} />
                                    )}
                                  </button>

                                  {/* Expanded subchapter content */}
                                  {isSubExpanded && (
                                    <div style={{ 
                                      padding: '16px',
                                      backgroundColor: '#f9fafb',
                                      borderTop: '1px solid #cbd5e1',
                                    }}>
                                      {subchapter.intro && (
                                        <div style={{
                                          fontSize: '15px',
                                          lineHeight: '1.6',
                                          color: '#555',
                                          marginBottom: '16px',
                                          fontWeight: 400,
                                        }}>
                                          {subchapter.intro}
                                        </div>
                                      )}
                                      
                                      {subchapter.tekst && (
                                        <div
                                          style={{
                                            fontSize: '15px',
                                            lineHeight: '1.6',
                                            color: '#333',
                                          }}
                                          className="content-html"
                                          dangerouslySetInnerHTML={{ 
                                            __html: DOMPurify.sanitize(subchapter.tekst) 
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
