import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import DOMPurify from 'dompurify'
import { getInfobit } from '../../api'
import type { InfoResultItem } from '../../types'

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
  const isRoot = depth === 0
  const depthStyle: CSSProperties = { ['--depth' as string]: depth }

  return (
    <div className='info-item' style={depthStyle}>
      <div className={`info-item__card ${isRoot ? 'info-item__card--root' : ''}`}>
        <div className='info-item__row'>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className='info-item__toggle'
              aria-label={expanded ? 'Skjul innhold' : 'Vis innhold'}
            >
              {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>
          )}
          <div className='info-item__content'>
            <h3 className={`info-item__title ${isRoot ? 'info-item__title--root' : ''}`}>
              {item.tittel}
            </h3>
            {item.infoId && (
              <p className='info-item__meta'>
                {item.infoType && `${item.infoType} • `}ID: {item.infoId}
              </p>
            )}
            {item.tekst && (
              <div
                className='info-item__text'
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.tekst) }}
              />
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className='info-item__children'>
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
        const data = await getInfobit(selectedId, {
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
    <div className='info-search'>

      {loading && (
        <div className='info-search__loading'>
          Laster...
        </div>
      )}

      {error && (
        <div
          className='info-search__error'
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
