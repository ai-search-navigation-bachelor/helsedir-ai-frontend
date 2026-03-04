import React from 'react'
import { colors } from '../../styles/dsTokens'
import type { ResultStats } from '../../types/dev'

interface StatsBarProps {
  statsA: ResultStats
  statsB: ResultStats
  statsC: ResultStats | null
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

export function StatsBar({ statsA, statsB, statsC }: StatsBarProps) {
  const rows = [
    { label: 'Totale treff', a: statsA.total, b: statsB.total, c: statsC?.total ?? '—' },
    {
      label: 'Gj.sn. score (topp 10)',
      a: statsA.avgScoreTop10,
      b: statsB.avgScoreTop10,
      c: statsC?.avgScoreTop10 ?? '—',
    },
    { label: 'Høyeste score', a: statsA.maxScore, b: statsB.maxScore, c: statsC?.maxScore ?? '—' },
    { label: 'Laveste score', a: statsA.minScore, b: statsB.minScore, c: statsC?.minScore ?? '—' },
  ]

  return (
    <div
      style={{
        marginBottom: '24px',
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.surfaceTinted }}>
            <th style={thStyle}>Statistikk</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig A</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig B</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Helsedir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
              <td style={tdStyle}>{row.label}</td>
              <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {row.a}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {row.b}
              </td>
              <td
                style={{
                  ...tdStyle,
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  color: colors.textSubtle,
                }}
              >
                {row.c}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
