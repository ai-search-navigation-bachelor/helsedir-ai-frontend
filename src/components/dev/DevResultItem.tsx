import { useState, useMemo } from 'react'
import type { SearchResult } from '../../types'
import type { WeightConfig } from '../../types/dev'
import { formatInfoTypeLabel, getPipelineScores } from './utils'

interface DevResultItemProps {
  rank: number
  result: SearchResult
  rankDiff: number | null
  config?: WeightConfig
  maxScore?: number
  allResults?: SearchResult[]
}

const mono = "'JetBrains Mono', 'Fira Code', monospace"

const FEATURE_LABELS: Record<string, string> = {
  semantic_score: 'Semantisk likhet',
  bm25_score: 'BM25 ordmatch',
  smoothed_ctr: 'Klikk-rate (CTR)',
  role_match: 'Rollematch',
  query_length: 'Lengde på søk',
  title_query_overlap: 'Tittel-overlap',
  content_freshness: 'Innholdsferskhet',
}

function computeRetRanks(result: SearchResult, allResults: SearchResult[]) {
  const scores = allResults.map((r) => {
    const p = getPipelineScores(r)
    return { id: r.id, bm25: p.bm25 ?? 0, semantic: p.semantic ?? 0 }
  })
  const bm25Sorted = [...scores].sort((a, b) => b.bm25 - a.bm25)
  const semSorted = [...scores].sort((a, b) => b.semantic - a.semantic)
  const bm25Rank = bm25Sorted.findIndex((s) => s.id === result.id) + 1
  const semRank = semSorted.findIndex((s) => s.id === result.id) + 1
  return { bm25Rank, semRank }
}

export function DevResultItem({
  rank,
  result,
  rankDiff,
  config,
  maxScore,
  allResults,
}: DevResultItemProps) {
  const [expanded, setExpanded] = useState(false)

  const infoTypeLabel = formatInfoTypeLabel(result.info_type)
  const {
    bm25,
    semantic,
    rrf,
    roleBoost,
    rerankScore,
    rerankRankChange,
    rerankContributions,
  } = getPipelineScores(result)

  const normalizedScore = maxScore && maxScore > 0 ? result.score / maxScore : null

  const configBoost = config
    ? result.info_type?.includes('temaside')
      ? config.temaside_boost
      : result.info_type?.includes('retningslinje')
        ? config.retningslinje_boost
        : null
    : null

  const retRanks = useMemo(() => {
    if (!allResults || allResults.length === 0) return null
    return computeRetRanks(result, allResults)
  }, [result, allResults])

  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        transition: 'background-color 0.12s ease',
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {/* Compact row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span
          style={{
            minWidth: '24px',
            fontWeight: 800,
            fontSize: '0.82rem',
            color: '#047FA4',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: '1.5',
          }}
        >
          {rank}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, color: '#1e293b', lineHeight: 1.5, fontSize: '0.85rem' }}>
            {result.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
            <Badge color="#047FA4" bg="#e0f2fe" title={`Innholdstype: ${result.info_type}`}>
              {infoTypeLabel}
            </Badge>

            {configBoost != null && configBoost !== 1.0 && (
              <Badge
                color={configBoost > 1.0 ? '#1d4ed8' : '#dc2626'}
                bg={configBoost > 1.0 ? '#dbeafe' : '#fee2e2'}
                title={`Innholdstype-boost: ×${configBoost}`}
              >
                Boost ×{configBoost}
              </Badge>
            )}

            {roleBoost != null && roleBoost !== 1.0 && (
              <Badge
                color={roleBoost > 1.0 ? '#059669' : '#dc2626'}
                bg={roleBoost > 1.0 ? '#d1fae5' : '#fee2e2'}
                title={roleBoost > 1.0 ? `Rolle-boost: ×${roleBoost}` : `Rolle-straff: ×${roleBoost}`}
              >
                Rolle ×{roleBoost}
              </Badge>
            )}

            {rerankScore !== undefined && (
              <Badge color="#7c3aed" bg="#f5f3ff" title="ML-rerank brukt">
                Rerank {typeof rerankRankChange === 'number' ? `${rerankRankChange > 0 ? '+' : ''}${rerankRankChange}` : ''}
              </Badge>
            )}

            {rankDiff !== null && rankDiff !== 0 && (
              <Badge
                color={rankDiff > 0 ? '#059669' : '#dc2626'}
                bg={rankDiff > 0 ? '#d1fae5' : '#fee2e2'}
                title={rankDiff > 0 ? `${rankDiff} plasser h\u00F8yere enn Konfig A` : `${Math.abs(rankDiff)} plasser lavere enn Konfig A`}
              >
                vs A {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
              </Badge>
            )}

            <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginLeft: '2px' }}>
              {expanded ? '\u25B2' : '\u25BC'}
            </span>
          </div>
        </div>

        {/* Score display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          {normalizedScore !== null && (
            <div style={{
              width: '48px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: '#e2e8f0',
              marginBottom: '3px',
            }}>
              <div style={{
                height: '100%',
                width: `${normalizedScore * 100}%`,
                borderRadius: '2px',
                backgroundColor: '#047FA4',
              }} />
            </div>
          )}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: mono,
              color: '#047FA4',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {result.score.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Expanded: Spreadsheet-style calculation breakdown */}
      {expanded && (
        <div
          style={{ marginTop: '8px', marginLeft: '14px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <ScoreSpreadsheet
            bm25={bm25}
            semantic={semantic}
            rrf={rrf}
            rerankScore={rerankScore}
            rerankRankChange={rerankRankChange}
            rerankContributions={rerankContributions}
            configBoost={configBoost}
            roleBoost={roleBoost}
            finalScore={result.score}
            config={config}
            bm25Rank={retRanks?.bm25Rank}
            semRank={retRanks?.semRank}
          />
        </div>
      )}
    </div>
  )
}

/* ── Badge ── */

function Badge({ children, color, bg, title }: { children: React.ReactNode; color: string; bg: string; title: string }) {
  return (
    <span
      style={{
        padding: '1px 7px',
        borderRadius: '4px',
        fontSize: '0.68rem',
        fontWeight: 600,
        color,
        backgroundColor: bg,
      }}
      title={title}
    >
      {children}
    </span>
  )
}

/* ── Spreadsheet-style score breakdown ── */

interface SpreadsheetProps {
  bm25?: number
  semantic?: number
  rrf?: number
  rerankScore?: number
  rerankRankChange?: number
  rerankContributions?: Record<string, number>
  configBoost: number | null
  roleBoost?: number | null
  finalScore: number
  config?: WeightConfig
  bm25Rank?: number
  semRank?: number
}

function CalcRow({ step, label, color, formula, result, sub, separator }: {
  step?: string
  label: string
  color: string
  formula: string
  result: string
  sub?: boolean
  separator?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      borderTop: separator ? '1px solid #e2e8f0' : undefined,
      backgroundColor: sub ? '#faf5ff' : undefined,
      fontSize: sub ? '0.66rem' : '0.72rem',
      lineHeight: 1.4,
    }}>
      {/* Label */}
      <div style={{
        padding: sub ? '3px 8px 3px 20px' : '5px 8px',
        fontWeight: 600,
        color,
        minWidth: sub ? undefined : '90px',
        flexShrink: 0,
        borderRight: '1px solid #f1f5f9',
        backgroundColor: sub ? undefined : '#fafbfc',
      }}>
        {step && <span style={{ color: '#94a3b8', marginRight: '4px' }}>{step}</span>}
        {label}
      </div>
      {/* Formula */}
      <div style={{
        flex: 1,
        padding: '3px 8px',
        fontFamily: mono,
        fontSize: sub ? '0.64rem' : '0.68rem',
        color: '#64748b',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {formula}
      </div>
      {/* Result */}
      <div style={{
        padding: '3px 8px',
        fontFamily: mono,
        fontWeight: 700,
        color,
        flexShrink: 0,
        textAlign: 'right',
        fontSize: sub ? '0.66rem' : '0.72rem',
      }}>
        {result}
      </div>
    </div>
  )
}

function ScoreSpreadsheet({
  bm25,
  semantic,
  rrf,
  rerankScore,
  rerankRankChange,
  rerankContributions,
  configBoost,
  roleBoost,
  finalScore,
  config,
  bm25Rank,
  semRank,
}: SpreadsheetProps) {
  const hasRerank = rerankScore !== undefined
  const hasBoosts = (configBoost != null && configBoost !== 1.0) || (roleBoost != null && roleBoost !== 1.0)
  let n = 1

  const k = config?.rrf_k ?? 60
  const bw = config?.bm25_weight ?? 0.3
  const sw = config?.semantic_weight ?? 0.7

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    }}>
      {/* Header */}
      <div style={{
        padding: '5px 8px',
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.66rem',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Score-regnestykke
      </div>

      {bm25 !== undefined && config && (
        <>
          {/* BM25 rank */}
          <CalcRow
            step={`${n++}.`}
            label="BM25"
            color="#0284c7"
            formula={`score ${bm25.toFixed(4)} \u2192 rang #${bm25Rank ?? '?'}`}
            result={`#${bm25Rank ?? '?'}`}
          />

          {/* Semantic rank */}
          {semantic !== undefined && (
            <CalcRow
              step={`${n++}.`}
              label="Semantisk"
              color="#059669"
              formula={`score ${semantic.toFixed(4)} \u2192 rang #${semRank ?? '?'}`}
              result={`#${semRank ?? '?'}`}
            />
          )}

          {/* RRF with multi-line breakdown */}
          {rrf !== undefined && (() => {
            const br = bm25Rank ?? '?'
            const sr = semRank ?? '?'
            const bm25Part = typeof br === 'number' ? bw / (k + br) : undefined
            const semPart = typeof sr === 'number' ? sw / (k + sr) : undefined
            const stepN = n++
            return (
              <>
                <CalcRow
                  step={`${stepN}.`}
                  label="RRF"
                  color="#047FA4"
                  formula="w₁/(k+rang₁) + w₂/(k+rang₂)"
                  result=""
                  separator
                />
                <CalcRow
                  label=""
                  color="#0284c7"
                  formula={`bm25: ${bw} / (${k} + ${br})`}
                  result={bm25Part?.toFixed(6) ?? '?'}
                  sub
                />
                <CalcRow
                  label=""
                  color="#059669"
                  formula={`sem:  ${sw} / (${k} + ${sr})`}
                  result={semPart?.toFixed(6) ?? '?'}
                  sub
                />
                <CalcRow
                  label=""
                  color="#047FA4"
                  formula={`     ${bm25Part?.toFixed(6) ?? '?'} + ${semPart?.toFixed(6) ?? '?'}`}
                  result={rrf.toFixed(6)}
                  sub
                />
              </>
            )
          })()}
        </>
      )}

      {/* Rerank */}
      {hasRerank && (() => {
        const stepN = n++
        const rankChangeStr = typeof rerankRankChange === 'number'
          ? rerankRankChange > 0 ? `${rerankRankChange} plasser opp` : rerankRankChange < 0 ? `${Math.abs(rerankRankChange)} plasser ned` : 'uendret'
          : null
        return (
          <>
            <CalcRow
              step={`${stepN}.`}
              label="Rerank"
              color="#7c3aed"
              formula="XGBoost LambdaMART"
              result={rerankScore!.toFixed(4)}
              separator
            />
            {rankChangeStr && (
              <CalcRow
                label=""
                color="#7c3aed"
                formula={`rangendring: ${rankChangeStr}`}
                result=""
                sub
              />
            )}
            {rerankContributions && Object.keys(rerankContributions).length > 0 &&
              Object.entries(rerankContributions)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([feature, val]) => (
                  <CalcRow
                    key={feature}
                    label=""
                    color={val >= 0 ? '#7c3aed' : '#dc2626'}
                    formula={`${FEATURE_LABELS[feature] ?? feature}`}
                    result={`${val >= 0 ? '+' : ''}${val.toFixed(3)}`}
                    sub
                  />
                ))
            }
          </>
        )
      })()}

      {/* Boost + normalisering */}
      {hasBoosts && (() => {
        const base = hasRerank ? rerankScore! : rrf ?? finalScore
        const factors: string[] = []
        const multipliers: number[] = []
        if (configBoost != null && configBoost !== 1.0) { factors.push(`×${configBoost}`); multipliers.push(configBoost) }
        if (roleBoost != null && roleBoost !== 1.0) { factors.push(`×${roleBoost}`); multipliers.push(roleBoost) }
        const boostedRaw = multipliers.reduce((acc, m) => acc * m, base)
        return (
          <>
            <CalcRow
              step={`${n++}.`}
              label="Boost"
              color="#d97706"
              formula={`${base.toFixed(4)} ${factors.join(' ')} = ${boostedRaw.toFixed(4)}`}
              result={boostedRaw.toFixed(4)}
              separator
            />
            <CalcRow
              step={`${n++}.`}
              label="Norm."
              color="#94a3b8"
              formula={`${boostedRaw.toFixed(4)} \u2192 normalisert`}
              result={finalScore.toFixed(4)}
            />
          </>
        )
      })()}

      {/* Final */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderTop: '2px solid #047FA4',
        backgroundColor: '#f0f9ff',
        padding: '5px 8px',
        fontSize: '0.76rem',
      }}>
        <span style={{ fontWeight: 700, color: '#047FA4', minWidth: '90px' }}>Endelig</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: 800, fontFamily: mono, color: '#047FA4', fontSize: '0.82rem' }}>
          {finalScore.toFixed(4)}
        </span>
      </div>
    </div>
  )
}

/* ── Results column header ── */

interface ResultsColumnHeaderProps {
  title: string
  subtitle: string
  extraInfo?: string
  roleInfo?: string
}

export function ResultsColumnHeader({
  title,
  subtitle,
  extraInfo,
  roleInfo,
}: ResultsColumnHeaderProps) {
  return (
    <div
      style={{
        padding: '14px 16px 10px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, marginBottom: '2px', color: '#1e293b' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>{subtitle}</p>
      {extraInfo && <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>{extraInfo}</p>}
      {roleInfo && <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>{roleInfo}</p>}
      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '6px 0 0', fontStyle: 'italic' }}>
        Klikk p&aring; et resultat for &aring; se score-regnestykket
      </p>
    </div>
  )
}
