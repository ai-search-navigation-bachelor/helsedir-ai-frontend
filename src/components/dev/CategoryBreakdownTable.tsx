import React from 'react'
import { Heading } from '@digdir/designsystemet-react'
import { colors } from '../../styles/dsTokens'
import { SEARCH_MAIN_CATEGORIES } from '../../constants/categories'

interface CategoryBreakdownTableProps {
  countsA: Record<string, number>
  countsB: Record<string, number>
  countsC: Record<string, number>
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: colors.text,
}

const tdStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.875rem',
  color: colors.text,
}

function formatDelta(delta: number): string {
  if (delta === 0) return '—'
  return delta > 0 ? `+${delta}` : String(delta)
}

function deltaColor(delta: number): string {
  if (delta > 0) return '#166534'
  if (delta < 0) return '#991b1b'
  return colors.textSubtle
}

export function CategoryBreakdownTable({ countsA, countsB, countsC }: CategoryBreakdownTableProps) {
  const keySet = new Set([...Object.keys(countsA), ...Object.keys(countsB), ...Object.keys(countsC)])
  const preferredOrder = SEARCH_MAIN_CATEGORIES.flatMap((category) => [...category.subcategoryIds])
  const preferredOrderKeys: string[] = [...preferredOrder]
  const preferredOrderSet = new Set<string>(preferredOrderKeys)

  const orderedKnownKeys = preferredOrderKeys.filter((key) => keySet.has(key))
  const unknownKeys = Array.from(keySet).filter((key) => !preferredOrderSet.has(key)).sort()
  const allKeys = [...orderedKnownKeys, ...unknownKeys]

  if (allKeys.length === 0) return null

  return (
    <div style={{ marginTop: '28px' }}>
      <Heading level={3} data-size="xs" style={{ marginBottom: '12px' }}>
        Kategorifordeling
      </Heading>
      <div
        style={{
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: colors.surfaceTinted }}>
              <th style={thStyle}>Kategori</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>A</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>B</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>C</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Delta B-A</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Delta C-A</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const a = countsA[key] ?? 0
              const b = countsB[key] ?? 0
              const c = countsC[key] ?? 0
              const deltaBA = b - a
              const deltaCA = c - a
              return (
                <tr key={key} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                  <td style={tdStyle}>{key}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{a}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{b}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: colors.textSubtle }}>{c}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: deltaBA !== 0 ? 600 : 400,
                      color: deltaColor(deltaBA),
                    }}
                  >
                    {formatDelta(deltaBA)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: deltaCA !== 0 ? 600 : 400,
                      color: deltaColor(deltaCA),
                    }}
                  >
                    {formatDelta(deltaCA)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
