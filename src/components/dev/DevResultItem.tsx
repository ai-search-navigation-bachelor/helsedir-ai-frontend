import { useState } from 'react'
import type { SearchResult } from '../../types'
import type { WeightConfig } from '../../types/dev'
import { formatInfoTypeLabel, getPipelineScores } from './utils'
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
  const {
    bm25,
    semantic,
    rrf,
    roleBoost,
    rerankScore,
    rerankRankChange,
    rerankContributions,
  } = getPipelineScores(result)
  const weightedBm25 = bm25 !== undefined && config ? bm25 * config.bm25_weight : bm25
  const weightedSemantic =
    semantic !== undefined && config ? semantic * config.semantic_weight : semantic

  const normalizedScore = maxScore && maxScore > 0 ? result.score / maxScore : null

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
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

            {roleBoost != null && roleBoost !== 1.0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: roleBoost > 1.0 ? '#d1fae5' : '#fee2e2',
                  color: roleBoost > 1.0 ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={roleBoost > 1.0
                  ? `Rolle-boost: score multiplisert med ${roleBoost} (prioritert for valgt rolle)`
                  : `Rolle-demping: score multiplisert med ${roleBoost} (nedprioritert for valgt rolle)`}
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>Rolle</span>
                {`\u00D7${roleBoost}`}
              </span>
            )}

            {rerankScore !== undefined && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="ML-rerank er brukt på dette treffet"
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>Rerank</span>
                {rerankRankChange ? `${rerankRankChange > 0 ? '+' : ''}${rerankRankChange}` : 'på'}
              </span>
            )}

            {rankDiff !== null && rankDiff !== 0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: rankDiff > 0 ? '#d1fae5' : '#fee2e2',
                  color: rankDiff > 0 ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={rankDiff > 0
                  ? `Rangert ${rankDiff} plasser høyere enn i Konfig A`
                  : `Rangert ${Math.abs(rankDiff)} plasser lavere enn i Konfig A`}
              >
                <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>vs A</span>
                {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
              </span>
            )}
          </div>
        </div>

        {(() => {
          const hasBoosted = rrf != null && rrf !== result.score
          const boostFactors: string[] = []
          if (configBoost != null && configBoost !== 1.0) boostFactors.push(String(configBoost))
          if (roleBoost != null && roleBoost !== 1.0) boostFactors.push(String(roleBoost))

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
                  title="RRF-score før boost"
                >
                  {rrf!.toFixed(4)}
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
                  title="Beregning: RRF-score × boostfaktorer"
                >
                  {rrf!.toFixed(4)}
                  {boostFactors.map((factor) => ` × ${factor}`).join('')}
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
                title={hasBoosted ? 'Endelig score (etter boost/rerank)' : 'Score'}
              >
                {result.score.toFixed(4)}
              </span>
            </div>
          )
        })()}
      </div>

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

          {(config && bm25 !== undefined) || rerankScore !== undefined ? (
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
              {bm25 !== undefined && config && (
                <>
                  <span style={{ color: '#0284c7' }}>BM25</span>
                  <span>{bm25.toFixed(3)} × vekt {config.bm25_weight.toFixed(2)} = {weightedBm25?.toFixed(3)}</span>
                </>
              )}
              {semantic !== undefined && config && (
                <>
                  <span style={{ color: '#059669' }}>Semantisk</span>
                  <span>{semantic.toFixed(3)} × vekt {config.semantic_weight.toFixed(2)} = {weightedSemantic?.toFixed(3)}</span>
                </>
              )}
              {rrf !== undefined && (
                <>
                  <span style={{ color: '#047FA4' }}>RRF</span>
                  <span>{rrf.toFixed(4)}</span>
                </>
              )}
              {rerankScore !== undefined && (
                <>
                  <span style={{ color: '#7c3aed' }}>Rerank</span>
                  <span>
                    {rerankScore.toFixed(4)}
                    {typeof rerankRankChange === 'number'
                      ? ` (${rerankRankChange > 0 ? '+' : ''}${rerankRankChange} plasser)`
                      : ''}
                  </span>
                </>
              )}
              <span style={{ color: '#047FA4' }}>Samlet</span>
              <span>{result.score.toFixed(4)}{rerankScore !== undefined ? ' (etter rerank)' : ' (RRF-fusjonert)'}</span>
            </div>
          ) : null}

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

          {rerankContributions && Object.keys(rerankContributions).length > 0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: '#f5f3ff',
                border: '1px solid #ddd6fe',
                fontSize: '0.7rem',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#7c3aed' }}>Rerank-bidrag:</strong>{' '}
              {Object.entries(rerankContributions)
                .map(([key, value]) => `${key}=${value.toFixed(3)}`)
                .join(', ')}
            </div>
          )}

          {roleBoost != null && roleBoost !== 1.0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: roleBoost > 1.0 ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${roleBoost > 1.0 ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.7rem',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: roleBoost > 1.0 ? '#059669' : '#dc2626' }}>
                Rolle-boost ×{roleBoost}:
              </strong>{' '}
              {roleBoost > 1.0
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
  roleInfo?: string
  mode: 'hybrid' | 'keyword'
}

export function ResultsColumnHeader({ title, subtitle, extraInfo, roleInfo, mode }: ResultsColumnHeaderProps) {
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
      {roleInfo && (
        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>{roleInfo}</p>
      )}
      <ScoreLegend mode={mode} />
      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '6px 0 0', fontStyle: 'italic' }}>
        Klikk på et resultat for å se score-detaljer
      </p>
    </div>
  )
}
