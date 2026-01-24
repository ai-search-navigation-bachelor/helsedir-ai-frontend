import { useState, useEffect, useRef } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import DOMPurify from 'dompurify'
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
          padding: '16px',
          marginBottom: '12px',
          backgroundColor: depth === 0 ? '#fff' : '#f9f9f9',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          boxShadow: depth === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#0051be',
                marginTop: '2px',
              }}
              aria-label={expanded ? 'Skjul innhold' : 'Vis innhold'}
            >
              {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h3 
              style={{ 
                margin: 0, 
                fontSize: depth === 0 ? '24px' : '18px', 
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: '1.4',
              }}
            >
              {item.tittel}
            </h3>
            {item.infoId && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                {item.infoType && `${item.infoType} • `}ID: {item.infoId}
              </p>
            )}
            {item.tekst && (
              <div 
                style={{ 
                  margin: '12px 0 0', 
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#333',
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.tekst) }}
              />
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ marginTop: '8px', marginLeft: '20px' }}>
          {item.children!.map((child) => (
            <InfoItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppInfoSearch({ selectedId, depth: initialDepth = 2 }: AppInfoSearchProps) {
  const [depth] = useState(initialDepth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InfoResultItem | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const fetchInfo = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      
      // Increment request ID for this fetch
      requestIdRef.current += 1
      const currentRequestId = requestIdRef.current

      setLoading(true)
      setError(null)

      try {
        const data = await getInfobitApi(selectedId, {
          signal: controller.signal,
          depth,
        })
        // Only update result if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setResult(data)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        // Only update error if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Henting av infobit feilet')
          setResult(null)
        }
      } finally {
        // Only clear loading if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false)
        }
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', backgroundColor: '#fff' }}>

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
