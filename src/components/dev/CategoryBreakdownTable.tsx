import { useState } from 'react'
import { SEARCH_MAIN_CATEGORIES } from '../../constants/categories'
import { formatInfoTypeLabel } from './utils'

interface CategoryBreakdownTableProps {
  countsA: Record<string, number>
  countsB: Record<string, number>
  countsC: Record<string, number>
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          minWidth: '28px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
      <div
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          backgroundColor: '#e2e8f0',
          overflow: 'hidden',
          minWidth: '40px',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            minWidth: value > 0 ? '3px' : 0,
            height: '100%',
            borderRadius: '3px',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

export function CategoryBreakdownTable({ countsA, countsB, countsC }: CategoryBreakdownTableProps) {
  const [isOpen, setIsOpen] = useState(false)

  const keySet = new Set([...Object.keys(countsA), ...Object.keys(countsB), ...Object.keys(countsC)])
  const preferredOrder = SEARCH_MAIN_CATEGORIES.flatMap((category) => [...category.subcategoryIds])
  const preferredOrderKeys: string[] = [...preferredOrder]
  const preferredOrderSet = new Set<string>(preferredOrderKeys)

  const orderedKnownKeys = preferredOrderKeys.filter((key) => keySet.has(key))
  const unknownKeys = Array.from(keySet).filter((key) => !preferredOrderSet.has(key)).sort()
  const allKeys = [...orderedKnownKeys, ...unknownKeys]

  if (allKeys.length === 0) return null

  const maxCount = Math.max(
    ...allKeys.flatMap((k) => [countsA[k] ?? 0, countsB[k] ?? 0, countsC[k] ?? 0]),
    1,
  )

  return (
    <div style={{ marginTop: '28px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="category-breakdown-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#475569',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '4px 0',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '0.65rem',
          }}
        >
          {'\u25B6'}
        </span>
        {`Kategorifordeling \u2013 treff per innholdstype`}
      </button>

      {isOpen && (
        <div
          id="category-breakdown-panel"
          style={{
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr 1fr 1fr',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>Kategori</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#047FA4', display: 'inline-block', flexShrink: 0 }} />
              Konfig A
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0284c7', display: 'inline-block', flexShrink: 0 }} />
              Konfig B
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#94a3b8', display: 'inline-block', flexShrink: 0 }} />
              Keyword
            </div>
          </div>

          {/* Category rows */}
          <div style={{ padding: '2px 0' }}>
            {allKeys.map((key) => {
              const a = countsA[key] ?? 0
              const b = countsB[key] ?? 0
              const c = countsC[key] ?? 0
              const displayName = formatInfoTypeLabel(key)

              return (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 1fr 1fr',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '5px 16px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#475569',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={key}
                  >
                    {displayName}
                  </span>
                  <Bar value={a} max={maxCount} color="#047FA4" />
                  <Bar value={b} max={maxCount} color="#0284c7" />
                  <Bar value={c} max={maxCount} color="#94a3b8" />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
