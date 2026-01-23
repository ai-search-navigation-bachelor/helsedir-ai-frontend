import type { FormEvent } from 'react'
import { useRef, useState } from 'react'

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

import type { SearchApiResult, SearchResultItem } from '../../api/search'
import { searchApi } from '../../api/search'

export type AppSearchProps = {
  label?: string
  placeholder?: string
  onSelectResult?: (id: string) => void
}

export function AppSearch({
  label = 'Søk',
  placeholder = 'Søk…',
  onSelectResult,
}: AppSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchApiResult | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = query.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const data = await searchApi(trimmed, { signal: controller.signal })
      setResult(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Ukjent feil')
    } finally {
      setIsLoading(false)
    }
  }

  function onClear() {
    abortRef.current?.abort()
    setQuery('')
    setError(null)
    setResult(null)
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

  function parseKoder(value: string | null | undefined): Record<string, string[]> | null {
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
      <Card
        onClick={() => onSelectResult?.(item.id)}
        style={{ cursor: onSelectResult ? 'pointer' : 'default' }}
      >
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
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <Search>
        <Search.Input
          aria-label={label}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search.Clear
          aria-label='Tøm'
          onClick={(e) => {
            e.preventDefault()
            onClear()
          }}
        />
        <Search.Button type='submit' variant='secondary' loading={isLoading}>
          Søk
        </Search.Button>
      </Search>

      {error && (
        <Alert data-color='danger'>
          <Paragraph>{error}</Paragraph>
        </Alert>
      )}

      {result != null && !error && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Paragraph data-size='sm' style={{ margin: 0 }}>
            Treff: {result.results.length}
          </Paragraph>
          {result.results.map((item) => (
            <ResultCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </form>
  )
}
