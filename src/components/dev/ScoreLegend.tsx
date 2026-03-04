import { ds, colors } from '../../styles/dsTokens'

interface ScoreLegendProps {
  mode: 'hybrid' | 'keyword'
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  )
}

function LegendRow({ color, label, desc }: { color: string; label: string; desc: string }) {
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
        backgroundColor: 'white',
        fontSize: '0.70rem',
        color: colors.textSubtle,
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      {mode === 'hybrid' ? (
        <>
          <LegendRow color="#3b82f6" label="BM25×w" desc="ordbasert score × BM25-vekt" />
          <LegendRow color="#10b981" label="Sem.×w" desc="semantisk score × semantisk vekt" />
          <LegendRow
            color={ds.color('logobla-1', 'text-default')}
            label="RRF-norm"
            desc="endelig RRF-score normalisert til 1 (topp-treff = 1.0)"
          />
        </>
      ) : (
        <LegendRow
          color={ds.color('logobla-1', 'text-default')}
          label="Final"
          desc="endelig score fra keyword-søk (tittelbasert)"
        />
      )}
    </div>
  )
}
