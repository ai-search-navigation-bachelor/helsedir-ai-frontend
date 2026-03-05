import { useState } from 'react'
import { HELSEDIR_STYLE_CONFIG } from '../constants/dev'
import { useDevSearch } from '../hooks/useDevSearch'
import { useRolesQuery } from '../hooks/queries/useRolesQuery'
import {
  WeightConfigPanel,
  ReadOnlyConfigPanel,
  StatsBar,
  DevResultItem,
  ResultsColumnHeader,
  CategoryBreakdownTable,
} from '../components/dev'

export function DevPage() {
  const [devRole, setDevRole] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)
  const { data: roles } = useRolesQuery()
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
    <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 pb-8 sm:px-6 lg:px-12">
      {/* Header */}
      <header style={{ marginBottom: '24px' }}>
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
            {`S\u00F8kevekting \u2013 Utviklerverkt\u00F8y`}
          </h1>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
          {`Sammenlign s\u00F8kekonfigurasjoner side om side. Klikk p\u00E5 et resultat for \u00E5 se score-detaljer.`}
        </p>
      </header>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            id="dev-query"
            type="text"
            aria-label={`S\u00F8keord for utviklerverkt\u00F8y`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && !isLoading) void runSearch(devRole)
            }}
            placeholder={`Skriv s\u00F8keord...`}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.92rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#1e293b',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#047FA4'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 127, 164, 0.12)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        <select
          aria-label="Velg rolle"
          value={devRole ?? ''}
          onChange={(e) => setDevRole(e.target.value || null)}
          style={{
            padding: '10px 14px',
            fontSize: '0.88rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#1e293b',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '150px',
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#047FA4'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 127, 164, 0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <option value="">Ingen rolle</option>
          {roles?.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.display_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void runSearch(devRole)}
          disabled={!query.trim() || isLoading}
          style={{
            padding: '10px 0',
            width: '140px',
            fontSize: '0.88rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            backgroundColor: !query.trim() || isLoading ? '#cbd5e1' : '#025169',
            color: '#fff',
            cursor: !query.trim() || isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            textAlign: 'center' as const,
          }}
        >
          {isLoading ? `S\u00F8ker...` : 'Sammenlign'}
        </button>
      </div>

      {/* Collapsible parameter guide */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: guideOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '0.65rem',
            }}
          >
            {'\u25B6'}
          </span>
          Hva betyr parameterne?
        </button>

        {guideOpen && (
          <div
            style={{
              marginTop: '8px',
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              fontSize: '0.8rem',
              color: '#334155',
              lineHeight: 1.7,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '4px 14px',
            }}
          >
            <strong style={{ color: '#0284c7' }}>BM25</strong>
            <span>{`Ordbasert s\u00F8k \u2013 sjeldne ord som finnes i f\u00E5 dokumenter f\u00E5r h\u00F8yere vekt (IDF).`}</span>

            <strong style={{ color: '#059669' }}>Semantisk</strong>
            <span>{`Forst\u00E5r betydningen av sp\u00F8rsm\u00E5let via vektorrepresentasjoner, finner relatert innhold uten ordlikhet.`}</span>

            <strong style={{ color: '#047FA4' }}>RRF-k</strong>
            <span>{`Reciprocal Rank Fusion \u2013 sl\u00E5r sammen BM25- og semantisk-listene. H\u00F8yere verdi = jevnere vekting, lavere = topp-treff l\u00F8ftes.`}</span>

            <strong style={{ color: '#1e293b' }}>Boost</strong>
            <span>{`Multipliserer scoren til utvalgte innholdstyper. 1.0 = n\u00F8ytral, over 1.0 = prioritering.`}</span>

            <strong style={{ color: '#1e293b' }}>Rolle</strong>
            <span>{`Tilpasser rangering for en spesifikk brukerrolle. Resultater med role_boost > 1.0 l\u00F8ftes, < 1.0 senkes.`}</span>
          </div>
        )}
      </div>

      {/* Collapsible config section */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setConfigOpen(!configOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: configOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '0.65rem',
            }}
          >
            {'\u25B6'}
          </span>
          Konfigurasjon
        </button>

        {configOpen && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
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
              label="Keyword-referanse"
              sublabel={'Ren keyword-s\u00F8k fra backend. Titteltreff vektes dobbelt, med stoppord-filtrering, stemming og synonymer. Faste booster: retningslinje \u00D71.3, veileder \u00D71.2, temaside \u00D71.15.'}
              config={HELSEDIR_STYLE_CONFIG}
              rowLabels={{ bm25: 'Keyword-vekt', rrf: 'RRF-k (ikke brukt)' }}
            />
          </div>
        )}
      </div>

      {/* Errors */}
      {slotA.error && <ErrorBanner message={slotA.error} />}
      {slotB.error && <ErrorBanner message={slotB.error} />}
      {slotHelsedir.error && <ErrorBanner message={slotHelsedir.error} />}

      {/* Loading */}
      {isLoading && !hasResults && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#047FA4',
              borderRadius: '50%',
              animation: 'dev-spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes dev-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Results */}
      {hasResults && statsA && statsB && (
        <>
          <StatsBar statsA={statsA} statsB={statsB} statsC={statsHelsedir} />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <ResultsColumn
              title={`Konfig A \u2014 ${slotA.response?.total ?? 0} treff`}
              subtitle={`BM25: ${slotA.config.bm25_weight.toFixed(2)} \u00B7 Sem: ${slotA.config.semantic_weight.toFixed(2)} \u00B7 RRF-k: ${slotA.config.rrf_k}`}
              extraInfo={`Boost: temaside ${slotA.config.temaside_boost.toFixed(2)} \u00B7 retningslinje ${slotA.config.retningslinje_boost.toFixed(2)}`}
              mode="hybrid"
              loading={slotA.loading}
            >
              {(slotA.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={null}
                  config={slotA.config}

                  maxScore={slotA.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Konfig B \u2014 ${slotB.response?.total ?? 0} treff`}
              subtitle={`BM25: ${slotB.config.bm25_weight.toFixed(2)} \u00B7 Sem: ${slotB.config.semantic_weight.toFixed(2)} \u00B7 RRF-k: ${slotB.config.rrf_k}`}
              extraInfo={`Boost: temaside ${slotB.config.temaside_boost.toFixed(2)} \u00B7 retningslinje ${slotB.config.retningslinje_boost.toFixed(2)}`}
              mode="hybrid"
              loading={slotB.loading}
            >
              {(slotB.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={getRankDiff(r.id, rankMapA, rankMapB)}
                  config={slotB.config}

                  maxScore={slotB.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Keyword \u2014 ${slotHelsedir.response?.total ?? 0} treff`}
              subtitle={'Kun ordbasert s\u00F8k, ingen semantisk matching'}
              mode="keyword"
              loading={slotHelsedir.loading}
            >
              {(slotHelsedir.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={null}

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

      {/* Empty state */}
      {!hasResults && !isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
          }}
        >
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            {`Skriv inn et s\u00F8keord og trykk `}
            <strong style={{ color: '#025169' }}>Sammenlign</strong>
            {` for \u00E5 starte.`}
          </p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        marginBottom: '12px',
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

interface ResultsColumnProps {
  title: string
  subtitle: string
  extraInfo?: string
  mode: 'hybrid' | 'keyword'
  loading: boolean
  children: React.ReactNode
}

function ResultsColumn({ title, subtitle, extraInfo, mode, loading, children }: ResultsColumnProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '300px',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
      }}
    >
      <ResultsColumnHeader title={title} subtitle={subtitle} extraInfo={extraInfo} mode={mode} />
      {loading ? (
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#047FA4',
              borderRadius: '50%',
              animation: 'dev-spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        children
      )}
    </div>
  )
}
