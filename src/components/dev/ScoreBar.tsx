/** Proportional bar showing the relative BM25 / semantic / RRF / rerank score components for a search result. */
import { resolveScoreColor, type ScoreColorKey } from './scoreColors'

interface ScoreBarProps {
  label: string
  value: number
  color: ScoreColorKey
}

export function ScoreBar({ label, value, color }: ScoreBarProps) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  const resolvedColor = resolveScoreColor(color)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
      <span
        style={{
          minWidth: '36px',
          color: '#64748b',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: 500,
          fontSize: '0.7rem',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '5px',
          borderRadius: '3px',
          backgroundColor: '#e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '3px',
            backgroundColor: resolvedColor,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      <span
        style={{
          minWidth: '32px',
          textAlign: 'right',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: 600,
          color: '#334155',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.7rem',
        }}
      >
        {value.toFixed(2)}
      </span>
    </div>
  )
}
