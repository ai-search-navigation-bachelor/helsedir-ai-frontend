import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getPresets,
  startGenerate,
  getGenerateStatus,
  trainModel,
  getModelInfo,
} from '../api/training'
import type { Preset, GenerateStatus, GenerateResponse, TrainResponse, ModelInfo } from '../api/training'

export function TrainingContent() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [presetsError, setPresetsError] = useState<string | null>(null)

  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null

  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateProgress, setGenerateProgress] = useState<GenerateStatus | null>(null)
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const [trainLoading, setTrainLoading] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainResponse | null>(null)
  const [trainError, setTrainError] = useState<string | null>(null)

  const [model, setModel] = useState<ModelInfo | null>(null)
  const [modelLoading, setModelLoading] = useState(false)

  const generateAbortRef = useRef<AbortController | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trainAbortRef = useRef<AbortController | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Clean up polling on unmount
  useEffect(() => stopPolling, [stopPolling])

  useEffect(() => {
    const controller = new AbortController()
    setPresetsLoading(true)
    setPresetsError(null)
    getPresets(controller.signal)
      .then((data) => {
        setPresets(data)
        if (data.length > 0) setSelectedPresetId(data[0].id)
        setPresetsLoading(false)
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return
        setPresetsError('Klarte ikke laste presets')
        setPresetsLoading(false)
      })
    return () => controller.abort()
  }, [])

  function handleGenerateClick() {
    setShowClearConfirm(true)
  }

  async function runGenerate(clear: boolean) {
    setShowClearConfirm(false)
    setGenerateLoading(true)
    setGenerateResult(null)
    setGenerateProgress(null)
    setGenerateError(null)
    setTrainResult(null)
    setTrainError(null)
    setModel(null)
    stopPolling()

    const controller = new AbortController()
    generateAbortRef.current = controller

    try {
      const { job_id } = await startGenerate(
        { preset_id: selectedPresetId ?? undefined, clear },
        controller.signal,
      )

      // Poll for progress using setTimeout chain to avoid overlapping requests
      async function poll() {
        try {
          const status = await getGenerateStatus(job_id, controller.signal)
          setGenerateProgress(status)

          if (status.status === 'completed') {
            stopPolling()
            setGenerateResult({
              success: true,
              searches_created: status.searches_created,
              results_shown: status.results_shown,
              clicks_created: status.clicks_created,
              skipped: status.skipped,
              training_groups_available: status.training_groups_available,
            })
            setGenerateLoading(false)
          } else if (status.status === 'failed') {
            stopPolling()
            setGenerateError(status.error || 'Generering feilet')
            setGenerateLoading(false)
          } else {
            pollRef.current = setTimeout(() => void poll(), 1500)
          }
        } catch (err: unknown) {
          if ((err as { name?: string }).name === 'AbortError') return
          stopPolling()
          setGenerateError('Mistet kontakt med backend under generering')
          setGenerateLoading(false)
        }
      }
      pollRef.current = setTimeout(() => void poll(), 1500)
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return
      setGenerateError('Feil under oppstart av generering')
      setGenerateLoading(false)
    }
  }

  async function runTrain() {
    setTrainLoading(true)
    setTrainResult(null)
    setTrainError(null)
    setModel(null)

    const controller = new AbortController()
    trainAbortRef.current = controller

    try {
      const result = await trainModel({ save: true }, controller.signal)
      setTrainResult(result)

      // Automatically fetch model info after training
      setModelLoading(true)
      try {
        const modelData = await getModelInfo(controller.signal)
        setModel(modelData)
      } catch {
        // non-fatal
      } finally {
        setModelLoading(false)
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return
      setTrainError('Feil under trening av modellen')
    } finally {
      setTrainLoading(false)
    }
  }

  const canGenerate = selectedPresetId !== null && !generateLoading && !trainLoading
  const canTrain =
    generateResult !== null &&
    generateResult.training_groups_available >= 20 &&
    !trainLoading &&
    !generateLoading
  const lowGroups =
    generateResult !== null && generateResult.training_groups_available < 20

  return (
    <>
      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#047FA4',
            }}
          />
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: 0,
              color: '#025169',
              letterSpacing: '-0.02em',
            }}
          >
            XGBoost reranker — treningspipeline
          </h1>
        </div>
        <p
          style={{
            fontSize: '0.88rem',
            color: '#64748b',
            margin: 0,
            maxWidth: '640px',
            lineHeight: 1.6,
          }}
        >
          Trener <strong style={{ color: '#334155' }}>reranking-modellen</strong> som kjøres som et
          siste steg etter hybrid-søk (BM25 + semantisk). Modellen lærer å prioritere resultater
          basert på klikkatferd. Aktiveres per søk med{' '}
          <code
            style={{
              background: '#f1f5f9',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            rerank=true
          </code>
          {' '}— påvirker ikke semantisk søk eller BM25 direkte.
        </p>
      </header>

      {/* Step layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Step 1: Preset */}
        <StepCard step={1} title="Velg preset">
          {presetsLoading && <SmallSpinner />}
          {presetsError && <ErrorBanner message={presetsError} />}
          {!presetsLoading && !presetsError && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 280px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Preset
                </label>
                <select
                  value={selectedPresetId ?? ''}
                  onChange={(e) => setSelectedPresetId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                    cursor: 'pointer',
                    appearance: 'auto',
                  }}
                >
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPreset && (
                <div
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '0.8rem',
                    color: '#334155',
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    {selectedPreset.name} — {selectedPreset.description}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 14px' }}>
                    <span style={{ color: '#64748b' }}>Antall sider</span>
                    <strong>{selectedPreset.top_n}</strong>
                    <span style={{ color: '#64748b' }}>Resultater per s{'\u00F8'}k</span>
                    <strong>{selectedPreset.k}</strong>
                    <span style={{ color: '#64748b' }}>Klikkrate m{'\u00E5'}lside</span>
                    <strong>{Math.round(selectedPreset.target_click_min * 100)}{'\u2013'}{Math.round(selectedPreset.target_click_max * 100)}%</strong>
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                      Treningsprioritet
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 14px' }}>
                      <span style={{ color: '#64748b' }}>Temasider</span>
                      <strong>{Math.round(selectedPreset.temaside_click_weight * 100)}%</strong>
                      <span style={{ color: '#64748b' }}>Retningslinjer</span>
                      <strong>{Math.round(selectedPreset.retningslinje_click_weight * 100)}%</strong>
                      <span style={{ color: '#64748b' }}>Annet innhold</span>
                      <strong>{Math.round(selectedPreset.other_click_weight * 100)}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* Step 2: Generate */}
        <StepCard step={2} title="Generer treningsdata">
          <p style={{ fontSize: '0.83rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
            Kjører ekte søk i bakgrunnen for å lage syntetiske klikk-logger. Dette kan ta{' '}
            <strong>1–3 minutter</strong>.
          </p>

          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={!canGenerate}
            style={{
              padding: '10px 22px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: canGenerate ? '#025169' : '#cbd5e1',
              color: '#fff',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {generateLoading && <Spinner />}
            {generateLoading ? 'Genererer…' : 'Generer treningsdata'}
          </button>

          {/* Progress bar */}
          {generateLoading && generateProgress && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                  {generateProgress.current} / {generateProgress.total} sider
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047FA4' }}>
                  {Math.round(generateProgress.progress * 100)}%
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(generateProgress.progress * 100)}%`,
                    borderRadius: '4px',
                    backgroundColor: '#047FA4',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>S{'\u00F8'}k: {generateProgress.searches_created}</span>
                <span>Resultater: {generateProgress.results_shown}</span>
                <span>Klikk: {generateProgress.clicks_created}</span>
              </div>
            </div>
          )}

          {generateError && (
            <div style={{ marginTop: '12px' }}>
              <ErrorBanner message={generateError} />
            </div>
          )}

          {generateResult && (
            <div style={{ marginTop: '16px' }}>
              <StatsGrid>
                <StatBox label="Søk opprettet" value={generateResult.searches_created} color="#047FA4" />
                <StatBox label="Resultater vist" value={generateResult.results_shown} color="#059669" />
                <StatBox label="Klikk simulert" value={generateResult.clicks_created} color="#7c3aed" />
                <StatBox label="Hoppet over" value={generateResult.skipped} color="#94a3b8" />
                <StatBox
                  label="Treningsgrupper"
                  value={generateResult.training_groups_available}
                  color={generateResult.training_groups_available >= 20 ? '#059669' : '#dc2626'}
                  highlight={generateResult.training_groups_available >= 20}
                />
              </StatsGrid>

              {lowGroups && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    color: '#c2410c',
                    fontSize: '0.83rem',
                    fontWeight: 500,
                  }}
                >
                  ⚠ Kun {generateResult.training_groups_available} treningsgrupper tilgjengelig — minst
                  20 kreves for å trene modellen. Prøv et preset med høyere top_n.
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* Step 3: Train */}
        <StepCard step={3} title="Tren reranker-modellen" dimmed={generateResult === null}>
          <p style={{ fontSize: '0.83rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
            Trener XGBoost-reranker-modellen fra klikk-loggene og laster den inn automatisk. Bare
            dette steget påvirker <code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>rerank=true</code>-søk.
          </p>

          <button
            type="button"
            onClick={() => void runTrain()}
            disabled={!canTrain}
            style={{
              padding: '10px 22px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: canTrain ? '#025169' : '#cbd5e1',
              color: '#fff',
              cursor: canTrain ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {trainLoading && <Spinner />}
            {trainLoading ? 'Trener reranker…' : 'Tren reranker-modell'}
          </button>

          {trainError && (
            <div style={{ marginTop: '12px' }}>
              <ErrorBanner message={trainError} />
            </div>
          )}

          {trainResult && (
            <div style={{ marginTop: '16px' }}>
              {trainResult.error ? (
                <ErrorBanner message={`Trening feilet: ${trainResult.error}`} />
              ) : (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      marginBottom: '12px',
                    }}
                  >
                    ✓ Modell trent og lastet inn
                  </div>
                  <StatsGrid>
                    <StatBox label="Grupper trent" value={trainResult.groups_trained} color="#047FA4" />
                    <StatBox label="Rader trent" value={trainResult.rows_trained} color="#059669" />
                  </StatsGrid>
                </>
              )}
            </div>
          )}

          {/* Feature importances */}
          {(modelLoading || model) && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Feature importances
              </h3>

              {modelLoading && <SmallSpinner />}

              {model && model.available && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {model.feature_names
                    .slice()
                    .sort(
                      (a, b) =>
                        (model.feature_importances[b] ?? 0) - (model.feature_importances[a] ?? 0),
                    )
                    .map((feature) => {
                      const value = model.feature_importances[feature] ?? 0
                      const pct = Math.round(value * 100)
                      return (
                        <div key={feature}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '3px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.78rem',
                                color: '#475569',
                                fontFamily: 'monospace',
                              }}
                            >
                              {feature}
                            </span>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#025169',
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div
                            style={{
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: '#e2e8f0',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                borderRadius: '3px',
                                backgroundColor: pct > 20 ? '#025169' : pct > 10 ? '#047FA4' : '#7dd3fc',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {model && !model.available && (
                <p style={{ fontSize: '0.83rem', color: '#94a3b8', margin: 0 }}>
                  Ingen modell lastet ennå.
                </p>
              )}
            </div>
          )}
        </StepCard>
      </div>

      {/* Confirmation dialog */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px 32px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}
            >
              Slett eksisterende loggdata?
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              <code
                style={{
                  background: '#f1f5f9',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                clear: true
              </code>{' '}
              sletter alle eksisterende søke- og klikk-logger før generering. Dette anbefales for å
              unngå at gamle data blandes inn.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => void runGenerate(false)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Behold gamle data
              </button>
              <button
                type="button"
                onClick={() => void runGenerate(true)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Slett og generer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes training-spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function StepCard({
  step,
  title,
  children,
  dimmed,
}: {
  step: number
  title: string
  children: React.ReactNode
  dimmed?: boolean
}) {
  return (
    <div
      style={{
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        overflow: 'hidden',
        opacity: dimmed ? 0.5 : 1,
        pointerEvents: dimmed ? 'none' : undefined,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#f8fafc',
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#025169',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {step}
        </div>
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
  highlight,
}: {
  label: string
  value: number
  color: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: highlight ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${highlight ? '#86efac' : '#e2e8f0'}`,
        minWidth: '120px',
      }}
    >
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 16px',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      {message}
    </div>
  )
}

function Spinner() {
  return (
    <div
      style={{
        width: '14px',
        height: '14px',
        border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'training-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

function SmallSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#047FA4',
          borderRadius: '50%',
          animation: 'training-spin 0.8s linear infinite',
        }}
      />
    </div>
  )
}
