import { useState, useEffect, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Alert,
  Card,
  CardBlock,
  Details,
  Heading,
  Link,
  Paragraph,
  Search,
  Tag,
} from '@digdir/designsystemet-react'

import { useSearchQuery } from '../hooks/queries/useSearchQuery'
import type { SearchResultItem } from '../api/search'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('searchquery') || ''
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync input value with URL parameter
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const { data, isLoading, error } = useSearchQuery(searchQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      navigate(`/search?searchquery=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleClear() {
    setInputValue('')
    navigate('/search')
  }

  function htmlToText(value: string): string {
    if (!value) return ''
    try {
      const doc = new DOMParser().parseFromString(value, 'text/html')
      return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
    } catch {
      return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }
  }

  function parseKoder(
    value: string | null | undefined,
  ): Record<string, string[]> | null {
    if (!value) return null
    try {
      const parsed = JSON.parse(value) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>
        const out: Record<string, string[]> = {}
        for (const [key, v] of Object.entries(record)) {
          if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
            out[key] = v as string[]
          }
        }
        return Object.keys(out).length > 0 ? out : null
      }
      return null
    } catch {
      return null
    }
  }

  function ResultCard({ item }: { item: SearchResultItem }) {
    const preview = item.tekst ? htmlToText(item.tekst) : ''
    const koder = parseKoder(item.koder)

    return (
      <Card>
        <CardBlock style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
          <Heading level={3} data-size='md' style={{ margin: 0 }}>
            {item.tittel}
          </Heading>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.infoType && <Tag variant='outline'>{item.infoType}</Tag>}
            {koder &&
              Object.entries(koder).flatMap(([key, values]) =>
                values.map((v) => (
                  <Tag key={`${item.id}-${key}-${v}`} variant='outline'>
                    {key}: {v}
                  </Tag>
                )),
              )}
          </div>

          <Paragraph data-size='sm' style={{ margin: 0 }}>
            <Link href={item.url}>Åpne kilde</Link>
          </Paragraph>

          {preview && (
            <Details>
              <Details.Summary>Vis tekst</Details.Summary>
              <Details.Content>
                <Paragraph style={{ margin: 0 }}>{preview}</Paragraph>
              </Details.Content>
            </Details>
          )}
        </CardBlock>
      </Card>
    )
  }

  return (
    <>
      <Heading level={2} data-size='lg'>
        Søk
      </Heading>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <Search>
          <Search.Input
            aria-label='Søk'
            placeholder='Søk…'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Search.Clear
            aria-label='Tøm'
            onClick={(e) => {
              e.preventDefault()
              handleClear()
            }}
          />
          <Search.Button type='submit' variant='secondary' loading={isLoading}>
            Søk
          </Search.Button>
        </Search>

        {error && (
          <Alert data-color='danger'>
            <Paragraph>{error.message || 'Ukjent feil'}</Paragraph>
          </Alert>
        )}

        {data && !error && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Paragraph data-size='sm' style={{ margin: 0 }}>
              Treff: {data.results.length}
            </Paragraph>
            {data.results.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </form>
    </>
  )
}
