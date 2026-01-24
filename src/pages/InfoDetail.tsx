import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiArrowLeft } from 'react-icons/fi'
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
      style={{
        position: 'sticky',
        top: '20px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Heading level={3} size='xs' style={{ marginBottom: '12px' }}>
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

function ContentWithSideNav({ result }: { result: InfoResultItem }) {
  const tocItems = useMemo(() => {
    return result.tekst ? extractH2Headings(result.tekst) : []
  }, [result.tekst])

  const processedHtml = useMemo(() => {
    return result.tekst ? addIdsToH2Elements(result.tekst) : ''
  }, [result.tekst])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Ukjent'
    const date = new Date(dateString)
    return date.toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Tittel og intro */}
      <div style={{ marginBottom: '48px' }}>
        <Heading level={1} size='xl' style={{ marginBottom: '20px', fontSize: '48px', fontWeight: 700 }}>
          {result.tittel}
        </Heading>
        {result.intro && (
          <Paragraph
            size='lg'
            style={{
              color: '#555',
              lineHeight: '1.6',
              fontSize: '22px',
              fontWeight: 500,
            }}
          >
            {result.intro}
          </Paragraph>
        )}
      </div>

      {/* To-kolonners layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: tocItems.length > 0 ? '250px 1fr' : '1fr',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Venstre kolonne - Table of Contents */}
        {tocItems.length > 0 && <TableOfContents items={tocItems} />}

        {/* Høyre kolonne - Hovedinnhold */}
        <div>
          <div
            style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#333',
            }}
            className="content-html"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Metadata nederst */}
          <div
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#666',
            }}
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Button
        variant='tertiary'
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px' }}
      >
        <FiArrowLeft size={20} />
        Tilbake
      </Button>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner title="Laster informasjon..." />
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
