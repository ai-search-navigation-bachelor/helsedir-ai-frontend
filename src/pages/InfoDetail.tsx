import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiArrowLeft } from 'react-icons/fi'
import DOMPurify from 'dompurify'
import { Button, Alert, Paragraph, Spinner, Heading } from '@digdir/designsystemet-react'
import type { InfoResultItem } from '../api/search'
import { getInfobitApi } from '../api/search'

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
      className='toc'
    >
      <Heading level={3} data-size='xs' className='toc__title'>
        På denne siden
      </Heading>
      <ul className='toc__list'>
        {items.map((item) => (
          <li key={item.id} className='toc__item'>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
              className={`toc__link ${activeId === item.id ? 'is-active' : ''}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ContentWithSideNav({ result }: { result: InfoResultItem }) {
  const tocItems = useMemo(() => {
    return result.tekst ? extractH2Headings(result.tekst) : []
  }, [result.tekst])

  const processedHtml = useMemo(() => {
    if (!result.tekst) return ''
    const htmlWithIds = addIdsToH2Elements(result.tekst)
    return DOMPurify.sanitize(htmlWithIds)
  }, [result.tekst])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Ukjent'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Ukjent'
    return date.toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Title and intro */}
      <div className='info-detail__header'>
        <Heading level={1} data-size='xl' className='info-detail__title'>
          {result.tittel}
        </Heading>
        {result.intro && (
          <Paragraph
            data-size='lg'
            className='info-detail__intro'
          >
            {result.intro}
          </Paragraph>
        )}
      </div>

      {/* Two-column layout */}
      <div className={`info-detail__layout ${tocItems.length > 0 ? 'info-detail__layout--toc' : ''}`}>
        {/* Left column - Table of contents */}
        {tocItems.length > 0 && <TableOfContents items={tocItems} />}

        {/* Right column - Main content */}
        <div>
          <div
            className="content-html"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Metadata */}
          <div
            className='info-detail__meta'
          >
            <p style={{ margin: 0 }}>
              <strong>Først publisert:</strong> {formatDate(result.forstPublisert)} |{' '}
              <strong>Siste faglige endring:</strong> {formatDate(result.sistFagligOppdatert)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InfoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [depth] = useState(2)

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['infobit', id, depth],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('ID mangler')
      return getInfobitApi(id, { signal, depth })
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })

  return (
    <div className='info-detail'>
      <Button
        variant='tertiary'
        onClick={() => navigate(-1)}
        className='info-detail__back'
      >
        <FiArrowLeft size={20} />
        Tilbake
      </Button>

      {isLoading && (
        <div className='info-detail__loading'>
          <Spinner aria-label="Laster informasjon..." />
        </div>
      )}

      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Henting av infobit feilet'}
          </Paragraph>
        </Alert>
      )}

      {result && <ContentWithSideNav result={result} />}
    </div>
  )
}
