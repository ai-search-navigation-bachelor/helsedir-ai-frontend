import type { WeightConfig, PipelineStageId } from '../../../types/dev'
import { SliderRow } from '../SliderRow'
import { useDevModelsQuery, useDevModelImportances, useSelectDevModel } from '../../../hooks/queries/useDevModelsQuery'

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
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 600 }}>
              Hva er Hybrid Search?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
              Hybrid Search kombinerer to ulike s&oslash;kemetoder for &aring; finne relevante dokumenter.
              Slideren styrer balansen mellom de to metodene &mdash; summen er alltid 1.0.
            </p>
          </div>

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
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>BM25 (ordbasert s&oslash;k)</span>
              <p style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0 0', lineHeight: 1.6 }}>
                Finner dokumenter basert p&aring; <strong>eksakte ord</strong> i s&oslash;ket ditt.
                Sjeldne ord gir h&oslash;yere treff (IDF-prinsippet), og ord i tittelen vektes ekstra.
              </p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.4 }}>
                Bra n&aring;r: Du s&oslash;ker etter spesifikke fagtermer, medisinnavn, eller lovhenvisninger.
              </p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Semantisk s&oslash;k (E5-modell)</span>
              <p style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0 0', lineHeight: 1.6 }}>
                Forst&aring;r <strong>betydningen</strong> av s&oslash;ket ditt, ikke bare ordene.
                Bruker en finjustert E5 embedding-modell for &aring; m&aring;le likhet mellom s&oslash;k og dokumenter.
              </p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.4 }}>
                Bra n&aring;r: Du beskriver et problem eller symptom med egne ord, uten &aring; kjenne fagtermer.
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === 'rrf' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 600 }}>
              Hva er RRF (Reciprocal Rank Fusion)?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 10px', lineHeight: 1.6 }}>
              RRF sl&aring;r sammen resultatlistene fra BM25 og semantisk s&oslash;k til &eacute;n samlet liste.
              Dokumenter som rangeres h&oslash;yt i <em>begge</em> listene f&aring;r best samlet score.
            </p>
          </div>

          {/* Formula box */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            marginBottom: '14px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.78rem',
            color: '#0c4a6e',
            lineHeight: 1.6,
          }}>
            {'score(doc) = \u03A3 w\u1D62 / (k + rank\u1D62(doc))'}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '0.8rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>
              BM25-vekt (w₁): {config.bm25_weight.toFixed(2)}
            </span>
            <span style={{ color: '#059669', fontWeight: 600 }}>
              Semantisk vekt (w₂): {config.semantic_weight.toFixed(2)}
            </span>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            marginBottom: '6px',
          }}>
            <p style={{ fontSize: '0.78rem', color: '#1e293b', margin: '0 0 8px', fontWeight: 600 }}>
              RRF-k (smoothing-parameter)
            </p>
            <SliderRow
              id="pipeline-rrf-k"
              label={`k = ${config.rrf_k}`}
              value={config.rrf_k}
              min={1}
              max={200}
              step={1}
              onChange={(v) => onChange({ ...config, rrf_k: v })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#f8fafc', fontSize: '0.74rem', color: '#475569', lineHeight: 1.5 }}>
                <strong>Lav k (f.eks. 1&ndash;20):</strong> Dokumenter som rangeres p&aring; topp f&aring;r mye h&oslash;yere score enn resten. St&oslash;rre sprik.
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#f8fafc', fontSize: '0.74rem', color: '#475569', lineHeight: 1.5 }}>
                <strong>H&oslash;y k (f.eks. 60&ndash;200):</strong> Scorene blir jevnere fordelt &mdash; ogs&aring; dokumenter lenger ned f&aring;r en sjanse.
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'ltr' && (
        <LtrPanel config={config} onChange={onChange} />
      )}

      {stage === 'boosts' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 600 }}>
              Hva er Post-processing?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 10px', lineHeight: 1.6 }}>
              Etter at dokumentene er rangert, kan vi justere scorene med <strong>multiplikative boosts</strong>.
              En verdi p&aring; 1.0 betyr ingen endring. Over 1.0 l&oslash;fter dokumentet opp, under 1.0 dytter det ned.
            </p>
          </div>

          {/* Innholdstype-boosts */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '8px',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            marginBottom: '14px',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Innholdstype-boost
            </span>
            <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '4px 0 10px', lineHeight: 1.5 }}>
              Prioriter bestemte dokumenttyper. F.eks. boost p&aring; 1.15 betyr +15% score for den typen.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              <div>
                <SliderRow
                  id="pipeline-temaside-boost"
                  label={`Temaside: ${config.temaside_boost.toFixed(2)}x`}
                  value={config.temaside_boost}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onChange={(v) => onChange({ ...config, temaside_boost: Math.round(v * 20) / 20 })}
                />
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Oversiktssider som dekker et bredt tema
                </p>
              </div>
              <div>
                <SliderRow
                  id="pipeline-retningslinje-boost"
                  label={`Retningslinje: ${config.retningslinje_boost.toFixed(2)}x`}
                  value={config.retningslinje_boost}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onChange={(v) => onChange({ ...config, retningslinje_boost: Math.round(v * 20) / 20 })}
                />
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Faglige anbefalinger fra Helsedirektoratet
                </p>
              </div>
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
            <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '4px 0 10px', lineHeight: 1.5 }}>
              Tilpass resultatene til en bestemt brukerrolle. Dokumenter tagget med den valgte rollen f&aring;r boost,
              mens dokumenter uten match f&aring;r en straff.
            </p>

            {/* Role selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
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
              <div>
                <SliderRow
                  id="pipeline-role-boost"
                  label={`Boost ved match: ${config.role_boost.toFixed(2)}x`}
                  value={config.role_boost}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onChange={(v) => onChange({ ...config, role_boost: Math.round(v * 20) / 20 })}
                />
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Multipliseres p&aring; dokumenter som matcher rollen
                </p>
              </div>
              <div>
                <SliderRow
                  id="pipeline-role-penalty"
                  label={`Straff ved mismatch: ${config.role_penalty.toFixed(2)}x`}
                  value={config.role_penalty}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onChange={(v) => onChange({ ...config, role_penalty: Math.round(v * 20) / 20 })}
                />
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Multipliseres p&aring; dokumenter som <em>ikke</em> matcher rollen
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── LTR Panel with model selection ── */

function LtrPanel({ config, onChange }: { config: WeightConfig; onChange: (c: WeightConfig) => void }) {
  const { data: models, isLoading: loading, error: fetchError } = useDevModelsQuery()
  const { data: featureImportances } = useDevModelImportances()
  const selectMutation = useSelectDevModel()

  const selectedPresetId = config.rerank_preset_id
  const selectedModel = models?.find((m) => m.preset_id === selectedPresetId)
  const selecting = selectMutation.isPending
  const error = fetchError
    ? (fetchError instanceof Error ? fetchError.message : 'Kunne ikke hente modeller')
    : selectMutation.error
      ? (selectMutation.error instanceof Error ? selectMutation.error.message : 'Kunne ikke bytte modell')
      : null

  function handleSelectModel(presetId: number) {
    onChange({ ...config, rerank_preset_id: presetId })
    selectMutation.mutate(presetId)
  }

  const sortedImportances = featureImportances
    ? Object.entries(featureImportances).sort(([, a], [, b]) => b - a)
    : null
  const maxImportance = sortedImportances && sortedImportances.length > 0
    ? Math.max(...sortedImportances.map(([, v]) => v))
    : 1

  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.85rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 600 }}>
          Hva er LTR (Learning to Rank)?
        </p>
        <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 8px', lineHeight: 1.6 }}>
          Etter at RRF har sl&aring;tt sammen resultatene, bruker LTR en maskinl&aelig;ringsmodell (XGBoost LambdaMART)
          til &aring; <strong>omrangere</strong> topp-kandidatene. Modellen ser p&aring; 6 ulike features for hvert dokument
          og l&aelig;rer hvilke kombinasjoner som gir mest relevante resultater.
        </p>

        {/* Feature explainer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', gridColumn: '1 / -1', marginBottom: '2px' }}>
            Features modellen bruker:
          </span>
          {[
            ['Klikk-rate (CTR)', 'Historisk klikkfrekvens p\u00E5 dokumentet'],
            ['Semantisk likhet', 'Betydningsbasert relevans (embedding-score)'],
            ['Tittel-overlap', 'Hvor godt s\u00F8ket treffer tittelen'],
            ['Rollematch', 'Om dokumentet passer brukerens rolle'],
            ['BM25 ordmatch', 'Ordbasert relevans fra BM25-s\u00F8ket'],
            ['Lengde p\u00E5 s\u00F8k', 'Antall ord/tegn i s\u00F8ket'],
          ].map(([feat, desc]) => (
            <div key={feat} style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
              <strong style={{ color: '#6d28d9' }}>{feat}:</strong> {desc}
            </div>
          ))}
        </div>
      </div>

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
            {models.map((m) => {
              const isSelected = m.preset_id === selectedPresetId
              return (
                <button
                  key={m.preset_id}
                  type="button"
                  onClick={() => handleSelectModel(m.preset_id)}
                  disabled={selecting}
                  title={m.description}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: '6px',
                    border: `2px solid ${isSelected ? '#7c3aed' : '#d1d5db'}`,
                    backgroundColor: isSelected ? '#f5f3ff' : '#fff',
                    color: isSelected ? '#7c3aed' : '#475569',
                    cursor: selecting ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: selecting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#7c3aed'
                      e.currentTarget.style.backgroundColor = '#faf5ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = '#fff'
                    }
                  }}
                >
                  {m.name}
                  {isSelected && (
                    <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#15803d' }}>{'\u2713'}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {selectedModel && (
          <p style={{ fontSize: '0.75rem', color: '#7c3aed', margin: '8px 0 0', fontWeight: 600 }}>
            Aktiv modell: {selectedModel.name}
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
