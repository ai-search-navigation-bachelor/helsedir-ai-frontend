import type { WeightConfig, PipelineStageId } from '../../../types/dev'
import { PIPELINE_STAGES, PRESETS } from '../../../constants/dev'
import { PipelineStage } from './PipelineStage'
import { PipelineConnector } from './PipelineConnector'
import { PipelineDetailPanel } from './PipelineDetailPanel'
import { useDevModelsQuery } from '../../../hooks/queries/useDevModelsQuery'

function configMatchesPreset(config: WeightConfig, preset: WeightConfig): boolean {
  return (
    config.bm25_weight === preset.bm25_weight &&
    config.semantic_weight === preset.semantic_weight &&
    config.rrf_k === preset.rrf_k &&
    config.temaside_boost === preset.temaside_boost &&
    config.retningslinje_boost === preset.retningslinje_boost &&
    (config.role ?? null) === (preset.role ?? null) &&
    config.role_boost === preset.role_boost &&
    config.role_penalty === preset.role_penalty &&
    !!config.rerank === !!preset.rerank
  )
}

interface RoleOption {
  slug: string
  display_name: string
}

interface SearchPipelineProps {
  configA: WeightConfig
  configB: WeightConfig
  onChangeA: (config: WeightConfig) => void
  onChangeB: (config: WeightConfig) => void
  activeStage: PipelineStageId | null
  activeConfig: 'a' | 'b'
  onStageSelect: (stage: PipelineStageId | null, config: 'a' | 'b') => void
  roles?: RoleOption[]
}

function getStageSummary(id: PipelineStageId, config: WeightConfig, activeModelName?: string | null): string {
  switch (id) {
    case 'hybrid':
      return `BM25: ${config.bm25_weight.toFixed(2)} | Sem: ${config.semantic_weight.toFixed(2)}`
    case 'rrf':
      return `k=${config.rrf_k}`
    case 'ltr': {
      if (!config.rerank) return 'Av'
      return activeModelName ? activeModelName : 'P\u00E5'
    }
    case 'boosts': {
      const parts = [`T:${config.temaside_boost.toFixed(2)}`, `R:${config.retningslinje_boost.toFixed(2)}`]
      if (config.role) parts.push(`${config.role} \u2191${config.role_boost.toFixed(2)} \u2193${config.role_penalty.toFixed(2)}`)
      return parts.join(' ')
    }
  }
}

function HybridSearchBox({
  config,
  isActive,
  onClick,
}: {
  config: WeightConfig
  isActive: boolean
  onClick: () => void
}) {
  const accentHex = '#047FA4'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 14px',
        width: '170px',
        flexShrink: 0,
        borderRadius: '8px',
        border: `2px solid ${isActive ? accentHex : '#e2e8f0'}`,
        backgroundColor: isActive ? `${accentHex}0d` : '#fff',
        boxShadow: isActive
          ? `inset 4px 0 0 ${accentHex}, 0 2px 8px ${accentHex}22`
          : `inset 4px 0 0 ${accentHex}, 0 1px 3px rgba(0,0,0,0.06)`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = `${accentHex}88`
          e.currentTarget.style.boxShadow = `inset 4px 0 0 ${accentHex}, 0 2px 6px ${accentHex}18`
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = `inset 4px 0 0 ${accentHex}, 0 1px 3px rgba(0,0,0,0.06)`
        }
      }}
    >
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isActive ? accentHex : '#1e293b', lineHeight: 1.2 }}>
        Hybrid Search
      </span>

      {/* BM25 sub-row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#0284c7', minWidth: '56px' }}>BM25</span>
        <div style={{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          backgroundColor: '#e2e8f0',
          position: 'relative',
          minWidth: '40px',
        }}>
          <div style={{
            height: '100%',
            borderRadius: '2px',
            backgroundColor: '#0284c7',
            width: `${Math.min(config.bm25_weight, 1) * 100}%`,
            transition: 'width 0.2s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7', fontFamily: "'JetBrains Mono', monospace", minWidth: '28px', textAlign: 'right' }}>
          {config.bm25_weight.toFixed(2)}
        </span>
      </div>

      {/* Semantic sub-row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#059669', minWidth: '56px' }}>Semantisk</span>
        <div style={{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          backgroundColor: '#e2e8f0',
          position: 'relative',
          minWidth: '40px',
        }}>
          <div style={{
            height: '100%',
            borderRadius: '2px',
            backgroundColor: '#059669',
            width: `${Math.min(config.semantic_weight, 1) * 100}%`,
            transition: 'width 0.2s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#059669', fontFamily: "'JetBrains Mono', monospace", minWidth: '28px', textAlign: 'right' }}>
          {config.semantic_weight.toFixed(2)}
        </span>
      </div>
    </button>
  )
}

function PipelineRow({
  label,
  config,
  activeStage,
  onStageClick,
  labelColor,
  onPreset,
  onChange,
  roles,
  activeModelName,
}: {
  label: string
  config: WeightConfig
  activeStage: PipelineStageId | null
  onStageClick: (id: PipelineStageId) => void
  labelColor: string
  onPreset: (preset: WeightConfig) => void
  onChange: (config: WeightConfig) => void
  roles?: RoleOption[]
  activeModelName: string | null
}) {
  const linear = PIPELINE_STAGES.slice(1) // rrf, ltr, boosts
  const activeAccent = activeStage
    ? PIPELINE_STAGES.find((s) => s.id === activeStage)?.accentHex ?? '#047FA4'
    : '#047FA4'

  return (
    <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '12px 12px 32px 12px',
        backgroundColor: '#fff',
        borderRadius: activeStage ? '10px 10px 0 0' : '10px',
        border: '1px solid #e2e8f0',
        borderBottom: activeStage ? 'none' : '1px solid #e2e8f0',
        overflow: 'visible',
      }}
    >
      {/* Config label + presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, marginRight: '20px' }}>
        <div
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            backgroundColor: labelColor,
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '160px' }}>
          {PRESETS.map(({ label: pLabel, config: pConfig }) => {
            const isMatch = configMatchesPreset(config, pConfig)
            return (
              <button
                key={pLabel}
                type="button"
                onClick={() => onPreset(pConfig)}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: isMatch ? `1px solid ${labelColor}` : '1px solid #d1d5db',
                  backgroundColor: isMatch ? `${labelColor}18` : '#f8fafc',
                  color: isMatch ? labelColor : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => {
                  if (!isMatch) {
                    e.currentTarget.style.backgroundColor = '#e0f2fe'
                    e.currentTarget.style.borderColor = '#7dd3fc'
                    e.currentTarget.style.color = '#0284c7'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMatch) {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#64748b'
                  }
                }}
              >
                {pLabel}
              </button>
            )
          })}
        </div>
      </div>

      {/* Query label */}
      <div
        style={{
          padding: '6px 10px',
          borderRadius: '6px',
          backgroundColor: '#f1f5f9',
          border: '1px dashed #94a3b8',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#475569',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          alignSelf: 'center',
        }}
      >
        Query
      </div>

      {/* Arrow from query → Hybrid Search */}
      <PipelineConnector type="straight" />

      {/* Hybrid Search box (replaces BM25+Semantic individual boxes) */}
      <HybridSearchBox
        config={config}
        isActive={activeStage === 'hybrid'}
        onClick={() => onStageClick('hybrid')}
      />

      {/* Arrow → RRF */}
      <PipelineConnector type="straight" />

      {/* RRF → Boosts group with LTR bypass path below */}
      {(() => {
        const rrfStage = linear[0] // rrf
        const ltrStage = linear[1] // ltr
        const boostsStage = linear[2] // boosts
        const branchColor = config.rerank ? '#7c3aed' : '#d1d5db'
        return (
          <div style={{ flexShrink: 0, position: 'relative' }}>
            {/* Main path: RRF → straight arrow → Boosts */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <PipelineStage
                id={rrfStage.id}
                label={rrfStage.label}
                description={rrfStage.description}
                accentHex={rrfStage.accentHex}
                isActive={activeStage === rrfStage.id}
                onClick={() => onStageClick(rrfStage.id)}
                summary={getStageSummary(rrfStage.id, config, activeModelName)}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PipelineConnector type="straight" dimmed={!!config.rerank} />
              </div>
              <PipelineStage
                id={boostsStage.id}
                label={boostsStage.label}
                description={boostsStage.description}
                accentHex={boostsStage.accentHex}
                isActive={activeStage === boostsStage.id}
                onClick={() => onStageClick(boostsStage.id)}
                summary={getStageSummary(boostsStage.id, config, activeModelName)}
              />
            </div>

            {/* LTR bypass path: down from RRF center → horizontal through LTR → up into Boosts center */}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
            }}>
              {/* All three line segments are absolute at known positions */}
              {/* Vertical line down from RRF bottom center */}
              <div style={{
                position: 'absolute',
                left: '74px',
                top: 0,
                width: '2px',
                height: '32px',
                backgroundColor: branchColor,
                transition: 'background-color 0.2s ease',
              }} />

              {/* Horizontal line connecting the two verticals */}
              <div style={{
                position: 'absolute',
                left: '74px',
                right: '74px',
                top: '30px',
                height: '2px',
                backgroundColor: branchColor,
                transition: 'background-color 0.2s ease',
              }} />

              {/* Vertical line up to Boosts bottom center + arrowhead */}
              <div style={{
                position: 'absolute',
                right: '74px',
                top: 0,
                width: '2px',
                height: '32px',
                backgroundColor: branchColor,
                transition: 'background-color 0.2s ease',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: `7px solid ${branchColor}`,
                  transition: 'border-bottom-color 0.2s ease',
                }} />
              </div>

              {/* LTR button centered on the horizontal line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '12px',
                position: 'relative',
                zIndex: 1,
              }}>
                <button
                  type="button"
                  onClick={() => onStageClick(ltrStage.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: config.rerank
                      ? `2px solid ${activeStage === ltrStage.id ? '#7c3aed' : '#c4b5fd'}`
                      : '2px dashed #d1d5db',
                    backgroundColor: config.rerank
                      ? (activeStage === ltrStage.id ? '#f3f0ff' : '#faf5ff')
                      : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    opacity: config.rerank ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (config.rerank && activeStage !== ltrStage.id) {
                      e.currentTarget.style.borderColor = '#7c3aed88'
                      e.currentTarget.style.boxShadow = '0 2px 6px #7c3aed18'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (config.rerank && activeStage !== ltrStage.id) {
                      e.currentTarget.style.borderColor = '#c4b5fd'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: config.rerank ? '#7c3aed' : '#94a3b8',
                    lineHeight: 1.2,
                  }}>
                    {ltrStage.label}
                  </span>
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: config.rerank ? '#7c3aed' : '#94a3b8',
                  }}>
                    {getStageSummary(ltrStage.id, config, activeModelName)}
                  </span>
                </button>
                <span style={{
                  fontSize: '0.56rem',
                  color: '#94a3b8',
                  fontWeight: 500,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}>
                  valgfri sidegren
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Output */}
      <PipelineConnector type="straight" />
      <div
        style={{
          padding: '6px 10px',
          borderRadius: '6px',
          backgroundColor: '#f0fdf4',
          border: '1px dashed #86efac',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#15803d',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Resultat
      </div>
    </div>

    {/* Detail panel directly below this row */}
    <div
      style={{
        display: 'grid',
        gridTemplateRows: activeStage ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.25s ease',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        {activeStage && (
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
            }}
          >
            <div style={{ padding: '6px 20px 0', fontSize: '0.72rem', fontWeight: 700, color: labelColor }}>
              {`Redigerer: ${label}`}
            </div>
            <PipelineDetailPanel
              stage={activeStage}
              config={config}
              onChange={onChange}
              accentHex={activeAccent}
              roles={roles}
            />
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

export function SearchPipeline({
  configA,
  configB,
  onChangeA,
  onChangeB,
  activeStage,
  activeConfig,
  onStageSelect,
  roles,
}: SearchPipelineProps) {
  const { data: models } = useDevModelsQuery()
  const activeModelName = models?.find((m) => m.active)?.name ?? null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <PipelineRow
          label="Konfig A"
          config={configA}
          activeStage={activeConfig === 'a' ? activeStage : null}
          onStageClick={(id) => onStageSelect(activeConfig === 'a' && activeStage === id ? null : id, 'a')}
          labelColor="#025169"
          onPreset={(p) => onChangeA({ ...p })}
          onChange={onChangeA}
          roles={roles}
          activeModelName={activeModelName}
        />
        <PipelineRow
          label="Konfig B"
          config={configB}
          activeStage={activeConfig === 'b' ? activeStage : null}
          onStageClick={(id) => onStageSelect(activeConfig === 'b' && activeStage === id ? null : id, 'b')}
          labelColor="#6366f1"
          onPreset={(p) => onChangeB({ ...p })}
          onChange={onChangeB}
          roles={roles}
          activeModelName={activeModelName}
        />
      </div>
    </div>
  )
}
