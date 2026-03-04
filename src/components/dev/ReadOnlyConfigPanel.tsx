import { Heading } from '@digdir/designsystemet-react'
import { colors } from '../../styles/dsTokens'
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
        border: `1px dashed ${colors.border}`,
        borderRadius: '12px',
        backgroundColor: colors.surface,
      }}
    >
      <Heading level={3} data-size="xs" style={{ marginBottom: '4px' }}>
        {label}
      </Heading>
      <p
        style={{
          fontSize: '0.75rem',
          color: colors.textSubtle,
          marginBottom: '16px',
          marginTop: 0,
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
