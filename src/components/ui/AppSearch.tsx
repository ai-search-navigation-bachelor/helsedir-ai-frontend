import type { FormEvent } from 'react'
import { useRef, useState } from 'react'

import {
  Alert,
  Card,
  CardBlock,
  Heading,
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

  function ResultCard({ item }: { item: SearchResultItem }) {
    return (
      <Card
        onClick={() => onSelectResult?.(item.id)}
        style={{ cursor: onSelectResult ? 'pointer' : 'default' }}
      >
        <CardBlock style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
          <Heading level={3} data-size='md' style={{ margin: 0 }}>
            {item.title}
          </Heading>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Tag variant='outline'>{item.info_type}</Tag>
            {item.score && (
              <Tag variant='outline'>Score: {item.score.toFixed(2)}</Tag>
            )}
          </div>

          {item.explanation && (
            <Paragraph data-size='sm' style={{ color: '#666', margin: 0 }}>
              {item.explanation}
            </Paragraph>
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
