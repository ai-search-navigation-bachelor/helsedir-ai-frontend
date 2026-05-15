/** Color-coded legend explaining each scoring component displayed in the dev page score bars. */
import { resolveScoreColor, type ScoreColorKey } from './scoreColors'

interface ScoreLegendProps {
  mode: 'hybrid' | 'keyword'
}

function LegendItem({ color, label }: { color: ScoreColorKey; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span
        style={{
          display: 'inline-block',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: resolveScoreColor(color),
        }}
      />
      <span style={{ color: '#64748b' }}>{label}</span>
    </div>
  )
}

export function ScoreLegend({ mode }: ScoreLegendProps) {
  return (
    <div
      style={{
        marginTop: '8px',
        display: 'flex',
        gap: '12px',
        fontSize: '0.68rem',
        flexWrap: 'wrap',
      }}
    >
      {mode === 'hybrid' ? (
        <>
          <LegendItem color="bm25" label="BM25 (ordbasert)" />
          <LegendItem color="semantic" label="Semantisk" />
          <LegendItem color="rrf" label="RRF" />
          <LegendItem color="rerank" label="Rerank" />
        </>
      ) : (
        <LegendItem color="rrf" label="Keyword-score" />
      )}
    </div>
  )
}
