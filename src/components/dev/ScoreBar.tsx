import { colors } from '../../styles/dsTokens'
import { resolveScoreColor, type ScoreColorKey } from './scoreColors'

interface ScoreBarProps {
  label: string
  value: number
  color: ScoreColorKey
}

export function ScoreBar({ label, value, color }: ScoreBarProps) {
  const BLOCKS = 10
  const filled = Math.round(Math.min(Math.max(value, 0), 1) * BLOCKS)
  const bar = '█'.repeat(filled) + '░'.repeat(BLOCKS - filled)
  const resolvedColor = resolveScoreColor(color)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.72rem',
        fontFamily: 'monospace',
      }}
    >
      <span style={{ minWidth: '44px', color: colors.textSubtle }}>{label}</span>
      <span style={{ color: resolvedColor, letterSpacing: '1px' }}>{bar}</span>
      <span style={{ color: colors.textSubtle, fontVariantNumeric: 'tabular-nums' }}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}
