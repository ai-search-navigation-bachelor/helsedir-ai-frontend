/** Read-only display of a weight configuration snapshot; mirrors WeightConfigPanel layout without interactive controls. */
import type { WeightConfig } from '../../types/dev'
import { SliderRow } from './SliderRow'

interface ReadOnlyConfigPanelProps {
  label: string
  sublabel: string
  config: WeightConfig
  rowLabels?: { bm25?: string; semantic?: string; rrf?: string }
}

const noop = () => { /* read-only */ }

export function ReadOnlyConfigPanel({ label, sublabel, config, rowLabels }: ReadOnlyConfigPanelProps) {
  const idBase = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div
      style={{
        flex: 1,
        minWidth: '280px',
        padding: '20px',
        borderRadius: '10px',
        backgroundColor: '#f8fafc',
        border: '1px dashed #cbd5e1',
      }}
    >
      <h3
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#64748b',
          marginBottom: '4px',
          marginTop: 0,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </h3>
      <p
        style={{
          fontSize: '0.72rem',
          color: '#94a3b8',
          marginBottom: '16px',
          marginTop: 0,
          lineHeight: 1.5,
        }}
      >
        {sublabel}
      </p>
      <SliderRow
        id={`${idBase}-bm25`}
        label={rowLabels?.bm25 ?? 'BM25-vekt'}
        value={config.bm25_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={noop}
        disabled
      />
      <SliderRow
        id={`${idBase}-semantic`}
        label={rowLabels?.semantic ?? 'Semantisk vekt'}
        value={config.semantic_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={noop}
        disabled
      />
      <SliderRow
        id={`${idBase}-rrf`}
        label={rowLabels?.rrf ?? 'RRF-k'}
        value={config.rrf_k}
        min={config.rrf_k === 0 ? 0 : 1}
        max={200}
        step={1}
        onChange={noop}
        disabled
      />
    </div>
  )
}
