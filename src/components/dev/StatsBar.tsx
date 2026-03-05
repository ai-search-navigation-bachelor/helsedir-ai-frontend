import React from 'react'
import type { ResultStats } from '../../types/dev'

interface StatsBarProps {
  statsA: ResultStats
  statsB: ResultStats
  statsC: ResultStats | null
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.72rem',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.82rem',
  color: '#1e293b',
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontVariantNumeric: 'tabular-nums',
}

function RoleBoostCell({ stats }: { stats: ResultStats }) {
  const { roleBoosted, rolePenalized, roleNeutral } = stats
  const hasAny = roleBoosted > 0 || rolePenalized > 0

  if (!hasAny) {
    return (
      <span style={{ color: '#94a3b8', fontFamily: 'inherit', fontStyle: 'italic', fontSize: '0.78rem' }}>
        Ingen rolle-boost
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      {roleBoosted > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#059669', fontWeight: 600 }}>{roleBoosted}</span>
          <span style={{ color: '#64748b', fontFamily: 'inherit', fontSize: '0.72rem' }}>prioritert</span>
        </span>
      )}
      {rolePenalized > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{rolePenalized}</span>
          <span style={{ color: '#64748b', fontFamily: 'inherit', fontSize: '0.72rem' }}>nedprioritert</span>
        </span>
      )}
      <span style={{ color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.72rem' }}>
        ({roleNeutral} {`up\u00E5virket`})
      </span>
    </div>
  )
}

export function StatsBar({ statsA, statsB, statsC }: StatsBarProps) {
  const rows: Array<{ label: string; tooltip?: string; a: React.ReactNode; b: React.ReactNode; c: React.ReactNode }> = [
    {
      label: 'Totale treff',
      tooltip: 'Antall dokumenter som matcher s\u00F8ket',
      a: statsA.total,
      b: statsB.total,
      c: statsC?.total ?? '\u2014',
    },
    {
      label: 'Gj.sn. score (topp 10)',
      tooltip: 'Gjennomsnittlig relevans-score for de 10 f\u00F8rste resultatene',
      a: statsA.avgScoreTop10,
      b: statsB.avgScoreTop10,
      c: statsC?.avgScoreTop10 ?? '\u2014',
    },
    {
      label: 'Score-spenn',
      tooltip: 'Laveste og h\u00F8yeste score blant alle resultater',
      a: `${statsA.minScore} \u2013 ${statsA.maxScore}`,
      b: `${statsB.minScore} \u2013 ${statsB.maxScore}`,
      c: statsC ? `${statsC.minScore} \u2013 ${statsC.maxScore}` : '\u2014',
    },
    {
      label: 'Rolle-tilpasning',
      tooltip: 'Hvor mange resultater som ble prioritert/nedprioritert basert p\u00E5 valgt rolle',
      a: <RoleBoostCell stats={statsA} />,
      b: <RoleBoostCell stats={statsB} />,
      c: statsC ? <RoleBoostCell stats={statsC} /> : '\u2014',
    },
  ]

  return (
    <div
      style={{
        marginBottom: '24px',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={thStyle}>Statistikk</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig A</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig B</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Keyword</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td
                style={{ ...tdStyle, fontFamily: 'inherit', fontWeight: 500, color: '#475569' }}
                title={row.tooltip}
              >
                {row.label}
                {row.tooltip && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: '5px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      color: '#64748b',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: '14px',
                      cursor: 'help',
                      verticalAlign: 'middle',
                    }}
                    title={row.tooltip}
                  >
                    ?
                  </span>
                )}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{row.a}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{row.b}</td>
              <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{row.c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
