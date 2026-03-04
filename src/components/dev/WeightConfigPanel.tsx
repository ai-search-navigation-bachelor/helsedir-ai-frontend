import { Button, Heading } from '@digdir/designsystemet-react'
import { ds, colors } from '../../styles/dsTokens'
import type { WeightConfig } from '../../types/dev'
import { PRESETS } from '../../constants/dev'
import { SliderRow } from './SliderRow'

interface WeightConfigPanelProps {
  label: string
  config: WeightConfig
  onChange: (config: WeightConfig) => void
}

export function WeightConfigPanel({ label, config, onChange }: WeightConfigPanelProps) {
  const idBase = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div
      style={{
        flex: 1,
        minWidth: '280px',
        padding: '20px',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        backgroundColor: colors.surface,
      }}
    >
      <Heading level={3} data-size="xs" style={{ marginBottom: '18px' }}>
        {label}
      </Heading>

      {/* Linked BM25 / Semantic slider — always sums to 1 */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.text,
          }}
        >
          <span>BM25: {config.bm25_weight.toFixed(2)}</span>
          <span>Semantisk: {config.semantic_weight.toFixed(2)}</span>
        </div>
        <input
          id={`${idBase}-bm25-semantic`}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.bm25_weight}
          onChange={(e) => {
            const rounded = Math.round(Number(e.target.value) * 20) / 20
            onChange({
              ...config,
              bm25_weight: rounded,
              semantic_weight: Math.round((1 - rounded) * 20) / 20,
            })
          }}
          style={{
            width: '100%',
            accentColor: ds.color('logobla-2', 'base-default'),
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Boost inputs */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text, minWidth: '44px' }}>
            Boost
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <BoostInput
              label="Temaside"
              value={config.temaside_boost}
              onChange={(v) => onChange({ ...config, temaside_boost: v })}
              ariaLabel="Temaside boost"
            />
            <BoostInput
              label="Retningslinje"
              value={config.retningslinje_boost}
              onChange={(v) => onChange({ ...config, retningslinje_boost: v })}
              ariaLabel="Retningslinje boost"
            />
          </div>
        </div>
      </div>

      <SliderRow
        id={`${idBase}-rrf`}
        label="RRF-k"
        value={config.rrf_k}
        min={1}
        max={200}
        step={1}
        onChange={(v) => onChange({ ...config, rrf_k: v })}
      />

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
        {PRESETS.map(({ label: presetLabel, config: preset }) => (
          <Button
            key={presetLabel}
            type="button"
            variant="secondary"
            onClick={() => onChange(preset)}
            data-size="sm"
            style={{
              padding: '4px 12px',
              fontSize: '0.78rem',
              borderRadius: '20px',
              color: colors.text,
            }}
          >
            {presetLabel}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface BoostInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  ariaLabel: string
}

function BoostInput({ label, value, onChange, ariaLabel }: BoostInputProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '0.82rem', color: colors.textSubtle, minWidth: '76px' }}>
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={3}
        step={0.05}
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (!Number.isFinite(next)) return
          onChange(Math.round(Math.min(3, Math.max(0, next)) * 100) / 100)
        }}
        style={{
          width: '72px',
          padding: '5px 8px',
          fontSize: '0.85rem',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          color: colors.text,
        }}
        aria-label={ariaLabel}
      />
    </div>
  )
}
