import { useState } from 'react'
import { useDevSearch } from '../hooks/useDevSearch'
import { useRolesQuery } from '../hooks/queries/useRolesQuery'
import {
  SearchPipeline,
  StatsBar,
  DevResultItem,
  ResultsColumnHeader,
  CategoryBreakdownTable,
} from '../components/dev'
import type { PipelineStageId } from '../types/dev'

export function DevPage() {
  const [activeStage, setActiveStage] = useState<PipelineStageId | null>(null)
  const [activeConfig, setActiveConfig] = useState<'a' | 'b'>('a')
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
      <div>
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
              if (e.key === 'Enter' && query.trim() && !isLoading) void runSearch()
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

        <button
          type="button"
          onClick={() => void runSearch()}
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

      {/* Pipeline visualization — both configs visible */}
      <SearchPipeline
        configA={slotA.config}
        configB={slotB.config}
        onChangeA={(cfg) => setSlotA((s) => ({ ...s, config: cfg }))}
        onChangeB={(cfg) => setSlotB((s) => ({ ...s, config: cfg }))}
        activeStage={activeStage}
        activeConfig={activeConfig}
        onStageSelect={(stage, cfg) => {
          setActiveStage(stage)
          setActiveConfig(cfg)
        }}
        roles={roles}
      />

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
              subtitle={`BM25: ${slotA.usedConfig?.bm25_weight.toFixed(2)} \u00B7 Sem: ${slotA.usedConfig?.semantic_weight.toFixed(2)} \u00B7 RRF-k: ${slotA.usedConfig?.rrf_k}`}
              extraInfo={`Boost: temaside ${slotA.usedConfig?.temaside_boost.toFixed(2)} \u00B7 retningslinje ${slotA.usedConfig?.retningslinje_boost.toFixed(2)}`}
              roleInfo={slotA.usedConfig?.role ? `Rolle: ${slotA.usedConfig.role} \u00B7 boost ${slotA.usedConfig.role_boost.toFixed(2)} \u00B7 straff ${slotA.usedConfig.role_penalty.toFixed(2)}` : undefined}
              loading={slotA.loading}
            >
              {(slotA.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={null}
                  config={slotA.usedConfig ?? slotA.config}
                  maxScore={slotA.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Konfig B \u2014 ${slotB.response?.total ?? 0} treff`}
              subtitle={`BM25: ${slotB.usedConfig?.bm25_weight.toFixed(2)} \u00B7 Sem: ${slotB.usedConfig?.semantic_weight.toFixed(2)} \u00B7 RRF-k: ${slotB.usedConfig?.rrf_k}`}
              extraInfo={`Boost: temaside ${slotB.usedConfig?.temaside_boost.toFixed(2)} \u00B7 retningslinje ${slotB.usedConfig?.retningslinje_boost.toFixed(2)}`}
              roleInfo={slotB.usedConfig?.role ? `Rolle: ${slotB.usedConfig.role} \u00B7 boost ${slotB.usedConfig.role_boost.toFixed(2)} \u00B7 straff ${slotB.usedConfig.role_penalty.toFixed(2)}` : undefined}
              loading={slotB.loading}
            >
              {(slotB.response?.results ?? []).map((r, i) => (
                <DevResultItem
                  key={r.id}
                  rank={i + 1}
                  result={r}
                  rankDiff={getRankDiff(r.id, rankMapA, rankMapB)}
                  config={slotB.usedConfig ?? slotB.config}
                  maxScore={slotB.response!.results[0]?.score}
                />
              ))}
            </ResultsColumn>

            <ResultsColumn
              title={`Keyword \u2014 ${slotHelsedir.response?.total ?? 0} treff`}
              subtitle={'Kun ordbasert s\u00F8k, ingen semantisk matching'}
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
  roleInfo?: string
  loading: boolean
  children: React.ReactNode
}

function ResultsColumn({ title, subtitle, extraInfo, roleInfo, loading, children }: ResultsColumnProps) {
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
      <ResultsColumnHeader title={title} subtitle={subtitle} extraInfo={extraInfo} roleInfo={roleInfo} />
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
