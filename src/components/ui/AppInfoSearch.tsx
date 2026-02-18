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
  const depthStyle: CSSProperties = {
    ['--depth' as string]: depth,
    marginLeft: 'calc(var(--depth, 0) * 1.25rem)',
  }

  return (
    <div style={depthStyle}>
      <div className={`p-4 mb-3 rounded-sm border border-[#e0e0e0] ${isRoot ? 'bg-white shadow-sm' : 'bg-[#f9f9f9]'}`}>
        <div className="flex items-start gap-3">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="bg-transparent border-0 cursor-pointer p-1 flex items-center text-[#0051be] mt-0.5"
              aria-label={expanded ? 'Skjul innhold' : 'Vis innhold'}
            >
              {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`m-0 font-semibold text-[#1a1a1a] leading-[1.4] ${isRoot ? 'text-2xl' : 'text-lg'}`}>
              {item.tittel}
            </h3>
            {item.infoId && (
              <p className="mt-2 mb-0 text-[0.8125rem] text-[#666]">
                {item.infoType && `${item.infoType} • `}ID: {item.infoId}
              </p>
            )}
            {item.tekst && (
              <div
                className="mt-3 mb-0 text-[0.9375rem] leading-[1.6] text-[#333]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.tekst) }}
              />
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-3 ml-5">
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
    <div className="max-w-[56.25rem] mx-auto p-6 bg-white">

      {loading && (
        <div className="text-center py-8 text-[#666]">
          Laster...
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#fee] rounded border border-[#e0e0e0] text-[#c00] mb-4">
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
