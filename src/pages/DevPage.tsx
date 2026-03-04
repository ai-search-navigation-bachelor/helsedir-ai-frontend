import { useState, useEffect, useRef } from 'react'
import { Alert, Button, Heading, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { search } from '../api/search'
import type { SearchResponse, SearchResult } from '../types'
import { ds, colors } from '../styles/dsTokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeightConfig {
  bm25_weight: number
  semantic_weight: number
  rrf_k: number
}

interface SlotState {
  config: WeightConfig
  response: SearchResponse | null
  loading: boolean
  error: string | null
}

interface ResultStats {
  total: number
  avgScoreTop10: number
  minScore: number
  maxScore: number
  categoryCounts: Record<string, number>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: WeightConfig = { bm25_weight: 0.3, semantic_weight: 0.7, rrf_k: 60 }
const BALANCED_CONFIG: WeightConfig = { bm25_weight: 0.5, semantic_weight: 0.5, rrf_k: 60 }

const PRESETS: Array<{ label: string; config: WeightConfig }> = [
  { label: 'Standard',      config: { bm25_weight: 0.3, semantic_weight: 0.7, rrf_k: 60 } },
  { label: 'Balansert',     config: { bm25_weight: 0.5, semantic_weight: 0.5, rrf_k: 60 } },
  { label: 'Kun semantisk', config: { bm25_weight: 0.0, semantic_weight: 1.0, rrf_k: 60 } },
  { label: 'Kun BM25',      config: { bm25_weight: 1.0, semantic_weight: 0.0, rrf_k: 60 } },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStats(response: SearchResponse): ResultStats {
  const results = response.results
  const top10 = results.slice(0, 10)
  const avgScoreTop10 =
    top10.length === 0
      ? 0
      : top10.reduce((sum, r) => sum + r.score, 0) / top10.length

  const scores = results.map((r) => r.score)
  return {
    total: response.total,
    avgScoreTop10: Math.round(avgScoreTop10 * 10000) / 10000,
    minScore: scores.length ? Math.round(Math.min(...scores) * 10000) / 10000 : 0,
    maxScore: scores.length ? Math.round(Math.max(...scores) * 10000) / 10000 : 0,
    categoryCounts: response.category_counts,
  }
}

function computeRankMap(results: SearchResult[]): Map<string, number> {
  const map = new Map<string, number>()
  results.forEach((r, i) => map.set(r.id, i + 1))
  return map
}

function getRankDiff(
  id: string,
  rankMapA: Map<string, number>,
  rankMapB: Map<string, number>,
): number | null {
  const rankA = rankMapA.get(id)
  const rankB = rankMapB.get(id)
  if (rankA === undefined || rankB === undefined) return null
  return rankA - rankB
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text }}>
          {label}
        </label>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: ds.color('logobla-1', 'text-default'),
            minWidth: '44px',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: ds.color('logobla-2', 'base-default') }}
      />
    </div>
  )
}

interface WeightConfigPanelProps {
  label: string
  config: WeightConfig
  onChange: (config: WeightConfig) => void
}

function WeightConfigPanel({ label, config, onChange }: WeightConfigPanelProps) {
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

      <SliderRow
        label="BM25-vekt"
        value={config.bm25_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ ...config, bm25_weight: v })}
      />
      <SliderRow
        label="Semantisk vekt"
        value={config.semantic_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ ...config, semantic_weight: v })}
      />
      <SliderRow
        label="RRF-k"
        value={config.rrf_k}
        min={1}
        max={200}
        step={1}
        onChange={(v) => onChange({ ...config, rrf_k: v })}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
        {PRESETS.map(({ label: presetLabel, config: preset }) => (
          <button
            key={presetLabel}
            type="button"
            onClick={() => onChange(preset)}
            style={{
              padding: '4px 12px',
              fontSize: '0.78rem',
              borderRadius: '20px',
              border: `1px solid ${colors.border}`,
              backgroundColor: 'white',
              cursor: 'pointer',
              color: colors.text,
            }}
          >
            {presetLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: colors.text,
}

const tdStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.875rem',
  color: colors.text,
}

interface StatsBarProps {
  statsA: ResultStats
  statsB: ResultStats
}

function StatsBar({ statsA, statsB }: StatsBarProps) {
  const rows: Array<{ label: string; a: string | number; b: string | number }> = [
    { label: 'Totale treff',             a: statsA.total,          b: statsB.total },
    { label: 'Gj.sn. score (topp 10)',   a: statsA.avgScoreTop10,  b: statsB.avgScoreTop10 },
    { label: 'Høyeste score',            a: statsA.maxScore,       b: statsB.maxScore },
    { label: 'Laveste score',            a: statsA.minScore,       b: statsB.minScore },
  ]

  return (
    <div
      style={{
        marginBottom: '24px',
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.surfaceTinted }}>
            <th style={thStyle}>Statistikk</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig A</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Konfig B</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
              <td style={tdStyle}>{row.label}</td>
              <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {row.a}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {row.b}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
      <span style={{ minWidth: '70px', color: colors.textSubtle }}>{label}</span>
      <div
        style={{
          width: '100px',
          height: '6px',
          backgroundColor: colors.borderSubtle,
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(value, 1) * 100}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '3px',
          }}
        />
      </div>
      <span style={{ minWidth: '42px', color: colors.textSubtle, fontVariantNumeric: 'tabular-nums' }}>
        {value.toFixed(3)}
      </span>
    </div>
  )
}

interface DevResultItemProps {
  rank: number
  result: SearchResult
  rankDiff: number | null
}

function DevResultItem({ rank, result, rankDiff }: DevResultItemProps) {
  const diffColor =
    rankDiff === null ? undefined
    : rankDiff > 0 ? { bg: '#dcfce7', text: '#166534' }
    : rankDiff < 0 ? { bg: '#fee2e2', text: '#991b1b' }
    : { bg: '#f1f5f9', text: '#475569' }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 12px',
        borderBottom: `1px solid ${colors.borderSubtle}`,
        fontSize: '0.875rem',
      }}
    >
      <span
        style={{
          minWidth: '24px',
          fontWeight: 700,
          color: colors.textSubtle,
          paddingTop: '2px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rank}
      </span>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '1px 8px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: ds.color('logobla-1', 'text-default'),
              backgroundColor: '#e8f4f8',
            }}
          >
            {result.info_type}
          </span>

          {rankDiff !== null && diffColor && (
            <span
              style={{
                display: 'inline-block',
                padding: '1px 7px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: diffColor.bg,
                color: diffColor.text,
              }}
            >
              {rankDiff > 0 ? `+${rankDiff}` : rankDiff === 0 ? '=' : String(rankDiff)}
            </span>
          )}
        </div>

        <div style={{ fontWeight: 500, color: colors.text, lineHeight: 1.4 }}>
          {result.title}
        </div>

        {(result.bm25_score !== undefined || result.semantic_score !== undefined) && (
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <ScoreBar label="BM25" value={result.bm25_score ?? 0} color="#3b82f6" />
            <ScoreBar label="Semantisk" value={result.semantic_score ?? 0} color="#10b981" />
          </div>
        )}
      </div>

      <span
        style={{
          minWidth: '56px',
          textAlign: 'right',
          fontWeight: 600,
          color: colors.textSubtle,
          paddingTop: '2px',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.8rem',
        }}
      >
        {result.score.toFixed(4)}
      </span>
    </div>
  )
}

interface CategoryBreakdownTableProps {
  countsA: Record<string, number>
  countsB: Record<string, number>
}

function CategoryBreakdownTable({ countsA, countsB }: CategoryBreakdownTableProps) {
  const allKeys = Array.from(
    new Set([...Object.keys(countsA), ...Object.keys(countsB)]),
  ).sort()

  if (allKeys.length === 0) return null

  return (
    <div style={{ marginTop: '28px' }}>
      <Heading level={3} data-size="xs" style={{ marginBottom: '12px' }}>
        Kategorifordeling
      </Heading>
      <div
        style={{
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: colors.surfaceTinted }}>
              <th style={thStyle}>Kategori</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>A</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>B</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Delta</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const a = countsA[key] ?? 0
              const b = countsB[key] ?? 0
              const delta = b - a
              return (
                <tr key={key} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                  <td style={tdStyle}>{key}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{a}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{b}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: delta !== 0 ? 600 : 400,
                      color:
                        delta > 0 ? '#166534'
                        : delta < 0 ? '#991b1b'
                        : colors.textSubtle,
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta === 0 ? '—' : String(delta)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function DevPage() {
  const [query, setQuery] = useState('')
  const [slotA, setSlotA] = useState<SlotState>({
    config: { ...DEFAULT_CONFIG },
    response: null,
    loading: false,
    error: null,
  })
  const [slotB, setSlotB] = useState<SlotState>({
    config: { ...BALANCED_CONFIG },
    response: null,
    loading: false,
    error: null,
  })

  const abortRef = useRef<{ a?: AbortController; b?: AbortController }>({})

  useEffect(() => {
    return () => {
      abortRef.current.a?.abort()
      abortRef.current.b?.abort()
    }
  }, [])

  async function runSearch() {
    const trimmed = query.trim()
    if (!trimmed) return

    abortRef.current.a?.abort()
    abortRef.current.b?.abort()

    const controllerA = new AbortController()
    const controllerB = new AbortController()
    abortRef.current = { a: controllerA, b: controllerB }

    setSlotA((s) => ({ ...s, loading: true, error: null }))
    setSlotB((s) => ({ ...s, loading: true, error: null }))

    const [resultA, resultB] = await Promise.allSettled([
      search(trimmed, { signal: controllerA.signal, limit: 20, log: false, ...slotA.config }),
      search(trimmed, { signal: controllerB.signal, limit: 20, log: false, ...slotB.config }),
    ])

    if (resultA.status === 'fulfilled') {
      setSlotA((s) => ({ ...s, loading: false, response: resultA.value }))
    } else if ((resultA.reason as Error)?.name !== 'AbortError') {
      setSlotA((s) => ({ ...s, loading: false, error: 'Søk A feilet. Sjekk konsollen for detaljer.' }))
    }

    if (resultB.status === 'fulfilled') {
      setSlotB((s) => ({ ...s, loading: false, response: resultB.value }))
    } else if ((resultB.reason as Error)?.name !== 'AbortError') {
      setSlotB((s) => ({ ...s, loading: false, error: 'Søk B feilet. Sjekk konsollen for detaljer.' }))
    }
  }

  const isLoading = slotA.loading || slotB.loading
  const hasResults = slotA.response !== null || slotB.response !== null
  const statsA = slotA.response ? computeStats(slotA.response) : null
  const statsB = slotB.response ? computeStats(slotB.response) : null
  const rankMapA = slotA.response ? computeRankMap(slotA.response.results) : new Map<string, number>()
  const rankMapB = slotB.response ? computeRankMap(slotB.response.results) : new Map<string, number>()

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-6 pb-12 sm:px-6 lg:px-12">
      <Heading level={1} data-size="md" style={{ marginBottom: '6px' }}>
        Utviklerverktøy – Hybrid søkevekting
      </Heading>
      <Paragraph data-size="sm" style={{ marginBottom: '28px', color: colors.textSubtle }}>
        Sammenlign to vektkonfigurasjoner for BM25 og semantisk søk side om side.
        Disse parameterne er skjult fra den offentlige API-dokumentasjonen.
      </Paragraph>

      {/* Search input */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="dev-query"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '6px',
              color: colors.text,
            }}
          >
            Søkeord
          </label>
          <input
            id="dev-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSearch()
            }}
            placeholder="Skriv inn søkeord..."
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: `1.5px solid ${colors.border}`,
              outline: 'none',
              boxSizing: 'border-box',
              color: colors.text,
            }}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => void runSearch()}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? 'Søker...' : 'Sammenlign søk'}
        </Button>
      </div>

      {/* Config panels */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <WeightConfigPanel
          label="Konfig A"
          config={slotA.config}
          onChange={(cfg) => setSlotA((s) => ({ ...s, config: cfg }))}
        />
        <WeightConfigPanel
          label="Konfig B"
          config={slotB.config}
          onChange={(cfg) => setSlotB((s) => ({ ...s, config: cfg }))}
        />
      </div>

      {/* Errors */}
      {slotA.error && (
        <Alert data-color="danger" style={{ marginBottom: '12px' }}>
          <Paragraph>{slotA.error}</Paragraph>
        </Alert>
      )}
      {slotB.error && (
        <Alert data-color="danger" style={{ marginBottom: '12px' }}>
          <Paragraph>{slotB.error}</Paragraph>
        </Alert>
      )}

      {/* Loading spinners (before first result) */}
      {isLoading && !hasResults && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spinner aria-label="Laster søkeresultater" data-size="lg" />
        </div>
      )}

      {/* Results */}
      {hasResults && statsA && statsB && (
        <>
          <StatsBar statsA={statsA} statsB={statsB} />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Config A results */}
            <div
              style={{
                flex: 1,
                minWidth: '300px',
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: colors.surfaceTinted,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Heading level={3} data-size="xs">
                  Konfig A — {slotA.response?.total ?? 0} treff
                </Heading>
                <Paragraph data-size="xs" style={{ color: colors.textSubtle, marginTop: '2px' }}>
                  BM25: {slotA.config.bm25_weight} · Semantisk: {slotA.config.semantic_weight} · RRF-k: {slotA.config.rrf_k}
                </Paragraph>
              </div>
              {slotA.loading ? (
                <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
                  <Spinner aria-label="Laster konfig A" />
                </div>
              ) : (
                (slotA.response?.results ?? []).map((r, i) => (
                  <DevResultItem key={r.id} rank={i + 1} result={r} rankDiff={null} />
                ))
              )}
            </div>

            {/* Config B results */}
            <div
              style={{
                flex: 1,
                minWidth: '300px',
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: colors.surfaceTinted,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Heading level={3} data-size="xs">
                  Konfig B — {slotB.response?.total ?? 0} treff
                </Heading>
                <Paragraph data-size="xs" style={{ color: colors.textSubtle, marginTop: '2px' }}>
                  BM25: {slotB.config.bm25_weight} · Semantisk: {slotB.config.semantic_weight} · RRF-k: {slotB.config.rrf_k}
                </Paragraph>
              </div>
              {slotB.loading ? (
                <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
                  <Spinner aria-label="Laster konfig B" />
                </div>
              ) : (
                (slotB.response?.results ?? []).map((r, i) => (
                  <DevResultItem
                    key={r.id}
                    rank={i + 1}
                    result={r}
                    rankDiff={getRankDiff(r.id, rankMapA, rankMapB)}
                  />
                ))
              )}
            </div>
          </div>

          <CategoryBreakdownTable
            countsA={statsA.categoryCounts}
            countsB={statsB.categoryCounts}
          />
        </>
      )}

      {/* Placeholder before first search */}
      {!hasResults && !isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: colors.textSubtle,
            border: `1px dashed ${colors.borderSubtle}`,
            borderRadius: '12px',
          }}
        >
          <Paragraph data-size="md">
            Skriv inn et søkeord og trykk «Sammenlign søk» for å starte.
          </Paragraph>
        </div>
      )}
    </div>
  )
}
