import { useState } from 'react'
import type { SearchResult } from '../../types'
import type { WeightConfig } from '../../types/dev'
import { parseExplanation, formatInfoTypeLabel } from './utils'
import { ScoreBar } from './ScoreBar'
import { ScoreLegend } from './ScoreLegend'

interface DevResultItemProps {
  rank: number
  result: SearchResult
  rankDiff: number | null
  config?: WeightConfig
  maxScore?: number
}

export function DevResultItem({
  rank,
  result,
  rankDiff,
  config,
  maxScore,
}: DevResultItemProps) {
  const [expanded, setExpanded] = useState(false)

  const infoTypeLabel = formatInfoTypeLabel(result.info_type)
  const parsed = parseExplanation(result.explanation)
  const bm25 = result.bm25_score ?? parsed.bm25
  const semantic = result.semantic_score ?? parsed.semantic
  const weightedBm25 = bm25 !== undefined && config ? bm25 * config.bm25_weight : bm25
  const weightedSemantic =
    semantic !== undefined && config ? semantic * config.semantic_weight : semantic

  const normalizedScore = maxScore && maxScore > 0 ? result.score / maxScore : null

  // Determine config boost for this result's info_type
  const configBoost = config
    ? result.info_type?.includes('temaside')
      ? config.temaside_boost
      : result.info_type?.includes('retningslinje')
        ? config.retningslinje_boost
        : null
    : null

  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        transition: 'background-color 0.12s ease',
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8fafc'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Rank */}
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

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div
            style={{
              fontWeight: 500,
              color: '#1e293b',
              lineHeight: 1.5,
              fontSize: '0.85rem',
            }}
          >
            {result.title}
          </div>

          {/* Badges row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
            {/* Info type */}
            <span
              style={{
                padding: '1px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 600,
                color: '#047FA4',
                backgroundColor: '#e0f2fe',
              }}
              title={`Innholdstype: ${result.info_type}`}
            >
              {infoTypeLabel}
            </span>

            {/* Config boost (temaside/retningslinje) */}
            {configBoost != null && configBoost !== 1.0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: configBoost > 1.0 ? '#dbeafe' : '#fee2e2',
                  color: configBoost > 1.0 ? '#1d4ed8' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={`Konfig-boost: innholdstype multiplisert med ${configBoost}`}
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>Boost</span>
                {`\u00D7${configBoost}`}
              </span>
            )}

            {/* Role boost — with label */}
            {result.role_boost != null && result.role_boost !== 1.0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor:
                    result.role_boost > 1.0
                      ? '#d1fae5'
                      : '#fee2e2',
                  color: result.role_boost > 1.0 ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={result.role_boost > 1.0
                  ? `Rolle-boost: score multiplisert med ${result.role_boost} (prioritert for valgt rolle)`
                  : `Rolle-demping: score multiplisert med ${result.role_boost} (nedprioritert for valgt rolle)`}
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>Rolle</span>
                {`\u00D7${result.role_boost}`}
              </span>
            )}

            {/* Rank diff — with label */}
            {rankDiff !== null && rankDiff !== 0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor:
                    rankDiff > 0
                      ? '#d1fae5'
                      : '#fee2e2',
                  color: rankDiff > 0 ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={rankDiff > 0
                  ? `Rangert ${rankDiff} plasser h\u00F8yere enn i Konfig A`
                  : `Rangert ${Math.abs(rankDiff)} plasser lavere enn i Konfig A`}
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>vs A</span>
                {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
              </span>
            )}
          </div>
        </div>

        {/* Score column */}
        {(() => {
          const hasBoosted = result.rrf_score != null && result.rrf_score !== result.score
          const boostFactors: string[] = []
          if (configBoost != null && configBoost !== 1.0) boostFactors.push(String(configBoost))
          if (result.role_boost != null && result.role_boost !== 1.0) boostFactors.push(String(result.role_boost))

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '1px',
                flexShrink: 0,
              }}
            >
              {hasBoosted && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: '#94a3b8',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontVariantNumeric: 'tabular-nums',
                    textDecoration: 'line-through',
                  }}
                  title="RRF-score f\u00F8r boost"
                >
                  {result.rrf_score!.toFixed(4)}
                </span>
              )}
              {hasBoosted && boostFactors.length > 0 && (
                <span
                  style={{
                    fontSize: '0.58rem',
                    color: '#94a3b8',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                  title="Beregning: RRF-score \u00D7 boostfaktorer"
                >
                  {result.rrf_score!.toFixed(4)}
                  {boostFactors.map((f) => ` \u00D7 ${f}`).join('')}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: '#047FA4',
                  fontVariantNumeric: 'tabular-nums',
                }}
                title={hasBoosted ? 'Endelig score (etter boost)' : 'Score'}
              >
                {result.score.toFixed(4)}
              </span>
            </div>
          )
        })()}
      </div>

      {/* Expandable detail section */}
      {expanded && (
        <div
          style={{
            marginTop: '8px',
            marginLeft: '34px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Score-detaljer
          </div>

          {/* Explanation text */}
          {result.explanation && (
            <div
              style={{
                fontSize: '0.7rem',
                color: '#64748b',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                marginBottom: '8px',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {result.explanation}
            </div>
          )}

          {/* Weighted calculation */}
          {config && bm25 !== undefined && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '2px 10px',
                fontSize: '0.68rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#64748b',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: '#0284c7' }}>BM25</span>
              <span>{bm25.toFixed(3)} {'\u00D7'} vekt {config.bm25_weight.toFixed(2)} = {weightedBm25?.toFixed(3)}</span>
              {semantic !== undefined && (
                <>
                  <span style={{ color: '#059669' }}>Semantisk</span>
                  <span>{semantic.toFixed(3)} {'\u00D7'} vekt {config.semantic_weight.toFixed(2)} = {weightedSemantic?.toFixed(3)}</span>
                </>
              )}
              <span style={{ color: '#047FA4' }}>Samlet</span>
              <span>{result.score.toFixed(4)} (RRF-fusjonert)</span>
            </div>
          )}

          {/* Score bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bm25 !== undefined && (
              <ScoreBar label="BM25" value={weightedBm25 ?? bm25} color="bm25" />
            )}
            {semantic !== undefined && (
              <ScoreBar label="Sem." value={weightedSemantic ?? semantic} color="semantic" />
            )}
            {normalizedScore !== null && (
              <ScoreBar label="Samlet" value={normalizedScore} color="rrf" />
            )}
          </div>

          {/* Role boost explanation if present */}
          {result.role_boost != null && result.role_boost !== 1.0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: result.role_boost > 1.0 ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${result.role_boost > 1.0 ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.7rem',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: result.role_boost > 1.0 ? '#059669' : '#dc2626' }}>
                Rolle-boost {'\u00D7'}{result.role_boost}:
              </strong>
              {' '}
              {result.role_boost > 1.0
                ? 'Denne innholdstypen er prioritert for valgt rolle. Scoren ble multiplisert opp.'
                : 'Denne innholdstypen er nedprioritert for valgt rolle. Scoren ble redusert.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResultsColumnHeaderProps {
  title: string
  subtitle: string
  extraInfo?: string
  mode: 'hybrid' | 'keyword'
}

export function ResultsColumnHeader({ title, subtitle, extraInfo, mode }: ResultsColumnHeaderProps) {
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
      {extraInfo && (
        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>{extraInfo}</p>
      )}
      <ScoreLegend mode={mode} />
      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '6px 0 0', fontStyle: 'italic' }}>
        {`Klikk p\u00E5 et resultat for \u00E5 se score-detaljer`}
      </p>
    </div>
  )
}
