import { Alert, Button, Heading, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { colors } from '../styles/dsTokens'
import { HELSEDIR_STYLE_CONFIG } from '../constants/dev'
import { useDevSearch } from '../hooks/useDevSearch'
import {
  WeightConfigPanel,
  ReadOnlyConfigPanel,
  StatsBar,
  DevResultItem,
  ResultsColumnHeader,
  CategoryBreakdownTable,
} from '../components/dev'

export function DevPage() {
  const {
    query,
    setQuery,
    slotA,
    setSlotA,
    slotB,
    setSlotB,
    slotHelsedir,
    isLoading,
    hasResults,
    statsA,
    statsB,
    statsHelsedir,
    rankMapA,
    rankMapB,
    getRankDiff,
    runSearch,
  } = useDevSearch()

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-12">
      <Heading level={1} data-size="md" style={{ marginBottom: '6px' }}>
        Utviklerverktøy – Søkevekting
      </Heading>
      <Paragraph data-size="sm" style={{ marginBottom: '20px', color: colors.textSubtle }}>
        Verktøy for å evaluere og sammenligne søkekonfigurasjoner i Helsedirektoratets søkesystem.
        Søkeresultatene vises side om side slik at man kan vurdere hvilke innstillinger som gir best
        treffkvalitet.
      </Paragraph>

      {/* Parameter explanation */}
      <div
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '8px',
          border: `1px solid ${colors.borderSubtle}`,
          backgroundColor: colors.surfaceTinted,
        }}
      >
        <Paragraph
          data-size="xs"
          style={{ margin: 0, marginBottom: '8px', color: colors.text, fontWeight: 600 }}
        >
          Om søkeparameterne
        </Paragraph>
        <Paragraph data-size="xs" style={{ margin: 0, color: colors.textSubtle, lineHeight: 1.6 }}>
          <strong style={{ color: colors.text }}>BM25</strong> er ordbasert søk som bruker invers
          dokumentfrekvens (IDF) — sjeldne ord som forekommer i få dokumenter vektes høyere enn
          vanlige ord, slik at unike og betydningsfulle søkeord får større påvirkning på rangeringen.{' '}
          <strong style={{ color: colors.text }}>Semantisk</strong> søk forstår betydningen av
          spørsmålet og finner relatert innhold selv uten ordlikhet, ved hjelp av
          vektorrepresentasjoner. Vektene for BM25 og Semantisk summerer alltid til 1.0 og styrer
          hvor mye hver metode bidrar til rangeringen.{' '}
          <strong style={{ color: colors.text }}>RRF-k</strong> (Reciprocal Rank Fusion) bestemmer
          hvordan resultatlistene fra BM25 og semantisk søk slås sammen — høyere verdi gir jevnere
          vekting mellom listene, lavere verdi løfter topp-treffene sterkere.{' '}
          <strong style={{ color: colors.text }}>Boost</strong> multipliserer scoren til utvalgte
          innholdstyper (temasider og retningslinjer) for å prioritere dem i rangeringen — 1.0 er
          nøytral, verdier over 1.0 løfter innholdstypen opp.
        </Paragraph>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          id="dev-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void runSearch() }}
          placeholder="Skriv inn søkeord og trykk Enter..."
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '1rem',
            borderRadius: '8px',
            border: `1.5px solid ${colors.border}`,
            outline: 'none',
            boxSizing: 'border-box',
            color: colors.text,
          }}
        />
        <Button
          variant="primary"
          onClick={() => void runSearch()}
          disabled={!query.trim() || isLoading}
          style={{ whiteSpace: 'nowrap' }}
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
        <ReadOnlyConfigPanel
          label="Konfig C — Helsedir-stil"
          sublabel="Fast referanse — keyword-søk (method=keyword)"
          config={HELSEDIR_STYLE_CONFIG}
          rowLabels={{ bm25: 'Keyword search vekt', rrf: 'RRF-k (ikke brukt)' }}
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
      {slotHelsedir.error && (
        <Alert data-color="danger" style={{ marginBottom: '12px' }}>
          <Paragraph>{slotHelsedir.error}</Paragraph>
        </Alert>
      )}

      {/* Initial loading spinner */}
      {isLoading && !hasResults && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spinner aria-label="Laster søkeresultater" data-size="lg" />
        </div>
      )}

      {/* Results */}
      {hasResults && statsA && statsB && (
        <>
          <StatsBar statsA={statsA} statsB={statsB} statsC={statsHelsedir} />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <ResultsColumn
              title={`Konfig A — ${slotA.response?.total ?? 0} treff`}
              subtitle={`BM25: ${slotA.config.bm25_weight.toFixed(2)} · Semantisk: ${slotA.config.semantic_weight.toFixed(2)} · RRF-k: ${slotA.config.rrf_k}`}
              extraInfo={`Temaside-boost: ${slotA.config.temaside_boost.toFixed(2)} · Retningslinje-boost: ${slotA.config.retningslinje_boost.toFixed(2)}`}
              mode="hybrid"
              loading={slotA.loading}
              loadingLabel="Laster konfig A"
            >
              {(slotA.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={null}
                  config={slotA.config}
                  scoringMode="hybrid"
                  maxScore={slotA.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Konfig B — ${slotB.response?.total ?? 0} treff`}
              subtitle={`BM25: ${slotB.config.bm25_weight.toFixed(2)} · Semantisk: ${slotB.config.semantic_weight.toFixed(2)} · RRF-k: ${slotB.config.rrf_k}`}
              extraInfo={`Temaside-boost: ${slotB.config.temaside_boost.toFixed(2)} · Retningslinje-boost: ${slotB.config.retningslinje_boost.toFixed(2)}`}
              mode="hybrid"
              loading={slotB.loading}
              loadingLabel="Laster konfig B"
            >
              {(slotB.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={getRankDiff(r.id, rankMapA, rankMapB)}
                  config={slotB.config}
                  scoringMode="hybrid"
                  maxScore={slotB.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Keyword-søk — ${slotHelsedir.response?.total ?? 0} treff`}
              subtitle="Keyword-søk · tittelbasert matching · RRF brukes ikke"
              mode="keyword"
              loading={slotHelsedir.loading}
              loadingLabel="Laster keyword-søk resultater"
            >
              {(slotHelsedir.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={null}
                  scoringMode="keyword"
                  maxScore={slotHelsedir.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>
          </div>

          <CategoryBreakdownTable
            countsA={statsA.categoryCounts}
            countsB={statsB.categoryCounts}
            countsC={statsHelsedir?.categoryCounts ?? {}}
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

// ---------------------------------------------------------------------------
// Local layout component — wraps a single results column
// ---------------------------------------------------------------------------

interface ResultsColumnProps {
  title: string
  subtitle: string
  extraInfo?: string
  mode: 'hybrid' | 'keyword'
  loading: boolean
  loadingLabel: string
  children: React.ReactNode
}

function ResultsColumn({
  title,
  subtitle,
  extraInfo,
  mode,
  loading,
  loadingLabel,
  children,
}: ResultsColumnProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '280px',
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <ResultsColumnHeader
        title={title}
        subtitle={subtitle}
        extraInfo={extraInfo}
        mode={mode}
      />
      {loading ? (
        <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
          <Spinner aria-label={loadingLabel} />
        </div>
      ) : (
        children
      )}
    </div>
  )
}
