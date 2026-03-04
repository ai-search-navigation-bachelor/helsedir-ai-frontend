import { colors } from '../../styles/dsTokens'
import { resolveScoreColor, type ScoreColorKey } from './scoreColors'

interface ScoreLegendProps {
  mode: 'hybrid' | 'keyword'
}

function Dot({ color }: { color: ScoreColorKey }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: resolveScoreColor(color),
        flexShrink: 0,
      }}
    />
  )
}

function LegendRow({ color, label, desc }: { color: ScoreColorKey; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
      <Dot color={color} />
      <span style={{ fontWeight: 600, color: colors.text }}>{label}</span>
      <span>— {desc}</span>
    </div>
  )
}

export function ScoreLegend({ mode }: ScoreLegendProps) {
  return (
    <div
      style={{
        marginTop: '8px',
        padding: '7px 10px',
        borderRadius: '6px',
        border: `1px solid ${colors.borderSubtle}`,
        backgroundColor: colors.surface,
        fontSize: '0.70rem',
        color: colors.textSubtle,
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      {mode === 'hybrid' ? (
        <>
          <LegendRow color="bm25" label="BM25×w" desc="ordbasert score × BM25-vekt" />
          <LegendRow color="semantic" label="Sem.×w" desc="semantisk score × semantisk vekt" />
          <LegendRow
            color="rrf"
            label="RRF-norm"
            desc="endelig RRF-score normalisert til 1 (topp-treff = 1.0)"
          />
        </>
      ) : (
        <LegendRow
          color="rrf"
          label="Final"
          desc="endelig score fra keyword-søk (tittelbasert)"
        />
      )}
    </div>
  )
}
