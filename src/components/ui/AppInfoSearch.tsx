import { useState, useEffect, useRef } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import type { InfoResultItem } from '../../api/search'
import { getInfobitApi } from '../../api/search'

type AppInfoSearchProps = {
  selectedId: string
  depth?: number
}

type InfoItemProps = {
  item: InfoResultItem
  depth: number
}

function InfoItem({ item, depth }: InfoItemProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = item.children && item.children.length > 0

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        style={{
          padding: '12px',
          marginBottom: '8px',
          backgroundColor: 'var(--fds-semantic-surface-neutral-subtle)',
          borderRadius: '4px',
          borderLeft: `3px solid var(--fds-semantic-border-info-default)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              {item.tittel}
            </h3>
            {item.infoId && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                ID: {item.infoId} {item.infoType && `| Type: ${item.infoType}`}
              </p>
            )}
            {item.tekst && (
              <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
                {item.tekst.substring(0, 150)}
                {item.tekst.length > 150 && '...'}
              </p>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '14px', marginTop: '8px', display: 'inline-block' }}
              >
                Les mer →
              </a>
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ marginTop: '8px' }}>
          {item.children!.map((child) => (
            <InfoItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppInfoSearch({ selectedId, depth: initialDepth = 2 }: AppInfoSearchProps) {
  const [depth, setDepth] = useState(initialDepth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InfoResultItem | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchInfo = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const data = await getInfobitApi(selectedId, {
          signal: controller.signal,
          depth,
        })
        setResult(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Henting av infobit feilet')
        setResult(null)
      } finally {
        setLoading(false)
      }
    }

    fetchInfo()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [selectedId, depth])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '24px' }}>Detaljert informasjon</h1>

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label htmlFor="depth" style={{ fontSize: '14px' }}>
          Dybde:
        </label>
        <input
          id="depth"
          type="number"
          min="1"
          max="5"
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          style={{
            width: '60px',
            padding: '6px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <span style={{ fontSize: '12px', color: '#666' }}>
          (1-5 nivåer av children)
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Laster...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fee',
            borderRadius: '4px',
            color: '#c00',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div>
          <InfoItem item={result} depth={0} />
        </div>
      )}
    </div>
  )
}
