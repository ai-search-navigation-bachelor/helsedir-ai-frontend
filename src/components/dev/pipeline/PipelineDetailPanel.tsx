import { useState } from 'react'
import type { WeightConfig, PipelineStageId } from '../../../types/dev'
import { SliderRow } from '../SliderRow'
import { useDevModelsQuery, useSelectDevModel } from '../../../hooks/queries/useDevModelsQuery'

interface RoleOption {
  slug: string
  display_name: string
}

interface PipelineDetailPanelProps {
  stage: PipelineStageId
  config: WeightConfig
  onChange: (config: WeightConfig) => void
  accentHex: string
  roles?: RoleOption[]
}

export function PipelineDetailPanel({ stage, config, onChange, accentHex, roles }: PipelineDetailPanelProps) {
  return (
    <div
      style={{
        borderTop: `3px solid ${accentHex}`,
        backgroundColor: '#f8fafc',
        borderRadius: '0 0 10px 10px',
        padding: '16px 20px',
        marginTop: '12px',
      }}
    >
      {stage === 'hybrid' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
            Hybrid s&oslash;k kombinerer BM25 (ordbasert) og semantisk s&oslash;k (E5-embeddings). Dra slideren for &aring; fordele vekten mellom de to metodene. Summen er alltid 1.0.
          </p>

          {/* Linked BM25/Semantic slider */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
              <span style={{ color: '#0284c7' }}>BM25: {config.bm25_weight.toFixed(2)}</span>
              <span style={{ color: '#059669' }}>Semantisk: {config.semantic_weight.toFixed(2)}</span>
            </div>
            <style>{`
              input.dev-hybrid-slider[type="range"] {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 3px;
                outline: none;
                cursor: pointer;
              }
              input.dev-hybrid-slider[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #fff;
                border: 2px solid #047FA4;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0,0,0,0.18);
              }
              input.dev-hybrid-slider[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #fff;
                border: 2px solid #047FA4;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0,0,0,0.18);
              }
              input.dev-hybrid-slider[type="range"]::-moz-range-track {
                height: 6px;
                border-radius: 3px;
                border: none;
              }
            `}</style>
            <input
              className="dev-hybrid-slider"
              id="pipeline-hybrid-balance"
              type="range"
              aria-label="BM25 / Semantisk vektbalanse"
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
                background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${config.bm25_weight * 100}%, #059669 ${config.bm25_weight * 100}%, #059669 100%)`,
              }}
            />
          </div>

          {/* Info boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>BM25 Retrieval</span>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                Okapi BM25 over tittel + body. Sjeldne ord f&aring;r h&oslash;yere vekt (IDF). Tittel-tokens vektes opp.
              </p>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Semantic Search</span>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                Dense retrieval med finjustert E5-modell. Cosine similarity mellom query- og dokument-embeddings.
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === 'rrf' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
            {'Reciprocal Rank Fusion. Fusjonerer de to rankede listene: score(doc) = \u03A3 w\u1D62 / (k + rank\u1D62(doc))'}
          </p>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.8rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>
              BM25-vekt: {config.bm25_weight.toFixed(2)}
            </span>
            <span style={{ color: '#059669', fontWeight: 600 }}>
              Semantisk vekt: {config.semantic_weight.toFixed(2)}
            </span>
          </div>
          <SliderRow
            id="pipeline-rrf-k"
            label={`RRF-k (smoothing): ${config.rrf_k}`}
            value={config.rrf_k}
            min={1}
            max={200}
            step={1}
            onChange={(v) => onChange({ ...config, rrf_k: v })}
          />
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>
            {'H\u00F8yere k = jevnere fordeling, lavere k = mer vekt til topp-rangeringer'}
          </p>
        </div>
      )}

      {stage === 'ltr' && (
        <LtrPanel config={config} onChange={onChange} />
      )}

      {stage === 'boosts' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 16px', lineHeight: 1.6 }}>
            Multiplikative boosts p&aring; combined_score etter reranking. Verdier over 1.0 prioriterer, under 1.0 straffer.
          </p>

          {/* Innholdstype-boosts */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Innholdstype-boost
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginTop: '8px' }}>
              <SliderRow
                id="pipeline-temaside-boost"
                label={`Temaside boost: ${config.temaside_boost.toFixed(2)}`}
                value={config.temaside_boost}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => onChange({ ...config, temaside_boost: Math.round(v * 20) / 20 })}
              />
              <SliderRow
                id="pipeline-retningslinje-boost"
                label={`Retningslinje boost: ${config.retningslinje_boost.toFixed(2)}`}
                value={config.retningslinje_boost}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => onChange({ ...config, retningslinje_boost: Math.round(v * 20) / 20 })}
              />
            </div>
          </div>

          {/* Rolle-seksjon */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rollebasert boosting
            </span>

            {/* Role selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '40px' }}>Rolle</span>
              <select
                aria-label="Velg rolle"
                value={config.role ?? ''}
                onChange={(e) => onChange({ ...config, role: e.target.value || null })}
                style={{
                  flex: 1,
                  maxWidth: '240px',
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#d97706' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db' }}
              >
                <option value="">Ingen rolle (alle)</option>
                {roles?.map((r) => (
                  <option key={r.slug} value={r.slug}>{r.display_name}</option>
                ))}
              </select>
              {config.role && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#15803d',
                  backgroundColor: '#f0fdf4',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                }}>
                  Aktiv
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              <SliderRow
                id="pipeline-role-boost"
                label={`Rolle boost (match): ${config.role_boost.toFixed(2)}`}
                value={config.role_boost}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => onChange({ ...config, role_boost: Math.round(v * 20) / 20 })}
              />
              <SliderRow
                id="pipeline-role-penalty"
                label={`Rolle straff (mismatch): ${config.role_penalty.toFixed(2)}`}
                value={config.role_penalty}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => onChange({ ...config, role_penalty: Math.round(v * 20) / 20 })}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.5 }}>
              Rolle boost multipliseres p&aring; dokumenter som matcher valgt rolle. Rolle straff multipliseres p&aring; dokumenter som ikke matcher.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── LTR Panel with model selection ── */

function LtrPanel({ config, onChange }: { config: WeightConfig; onChange: (c: WeightConfig) => void }) {
  const { data: models, isLoading: loading, error: fetchError } = useDevModelsQuery()
  const selectMutation = useSelectDevModel()
  const [featureImportances, setFeatureImportances] = useState<Record<string, number> | null>(null)

  const activeModel = models?.find((m) => m.active)
  const selecting = selectMutation.isPending
  const error = fetchError
    ? (fetchError instanceof Error ? fetchError.message : 'Kunne ikke hente modeller')
    : selectMutation.error
      ? (selectMutation.error instanceof Error ? selectMutation.error.message : 'Kunne ikke bytte modell')
      : null

  function handleSelectModel(presetId: number) {
    selectMutation.mutate(presetId, {
      onSuccess: (res) => setFeatureImportances(res.feature_importances),
    })
  }

  const sortedImportances = featureImportances
    ? Object.entries(featureImportances).sort(([, a], [, b]) => b - a)
    : null
  const maxImportance = sortedImportances ? Math.max(...sortedImportances.map(([, v]) => v)) : 1

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
        XGBoost LambdaMART-modell som reranker topp-kandidater basert p&aring; 7 features. Velg en ferdigtrent modell nedenfor.
      </p>

      {/* Rerank toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <label htmlFor="pipeline-rerank-toggle" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
          Reranking
        </label>
        <button
          id="pipeline-rerank-toggle"
          type="button"
          onClick={() => onChange({ ...config, rerank: !config.rerank })}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: config.rerank ? '#7c3aed' : '#cbd5e1',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background-color 0.2s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '2px',
            left: config.rerank ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
        <span style={{ fontSize: '0.78rem', color: config.rerank ? '#7c3aed' : '#94a3b8', fontWeight: 600 }}>
          {config.rerank ? 'P\u00E5' : 'Av'}
        </span>
      </div>

      {/* Model selector */}
      <div style={{
        padding: '14px 16px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Velg modell
        </span>

        {loading && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0 0' }}>Laster modeller...</p>
        )}

        {error && (
          <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '8px 0 0' }}>{error}</p>
        )}

        {!loading && models && models.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {models.map((m) => (
              <button
                key={m.preset_id}
                type="button"
                onClick={() => handleSelectModel(m.preset_id)}
                disabled={selecting}
                title={m.description}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: m.active ? 700 : 500,
                  borderRadius: '6px',
                  border: `2px solid ${m.active ? '#7c3aed' : '#d1d5db'}`,
                  backgroundColor: m.active ? '#f5f3ff' : '#fff',
                  color: m.active ? '#7c3aed' : '#475569',
                  cursor: selecting ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: selecting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!m.active) {
                    e.currentTarget.style.borderColor = '#7c3aed'
                    e.currentTarget.style.backgroundColor = '#faf5ff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!m.active) {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = '#fff'
                  }
                }}
              >
                {m.name}
                {m.active && (
                  <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#15803d' }}>{'\u2713'}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {activeModel && (
          <p style={{ fontSize: '0.75rem', color: '#7c3aed', margin: '8px 0 0', fontWeight: 600 }}>
            Aktiv modell: {activeModel.name}
          </p>
        )}
      </div>

      {/* Feature importances bar chart */}
      {sortedImportances && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Feature importances
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {sortedImportances.map(([name, value]) => {
              const pct = (value / maxImportance) * 100
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#475569',
                    fontFamily: "'JetBrains Mono', monospace",
                    minWidth: '140px',
                    textAlign: 'right',
                  }}>
                    {name}
                  </span>
                  <div style={{ flex: 1, height: '14px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: pct > 60 ? '#7c3aed' : pct > 30 ? '#a78bfa' : '#c4b5fd',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#7c3aed',
                    fontFamily: "'JetBrains Mono', monospace",
                    minWidth: '42px',
                    textAlign: 'right',
                  }}>
                    {(value * 100).toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
