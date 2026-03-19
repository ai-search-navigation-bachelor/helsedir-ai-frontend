import { useState } from 'react'
import type { SearchResult } from '../../types'
import type { WeightConfig } from '../../types/dev'
import { formatInfoTypeLabel, getPipelineScores } from './utils'

interface DevResultItemProps {
  rank: number
  result: SearchResult
  rankDiff: number | null
  config?: WeightConfig
  maxScore?: number
}

const mono = "'JetBrains Mono', 'Fira Code', monospace"

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
                title={rankDiff > 0 ? `${rankDiff} plasser høyere enn Konfig A` : `${Math.abs(rankDiff)} plasser lavere enn Konfig A`}
              >
                vs A {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
              </Badge>
            )}

            {/* Expand hint */}
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
          style={{ marginTop: '8px', marginLeft: '34px' }}
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
}

function Row({ label, color, value, formula, indent, highlight, separator }: {
  label: string; color: string; value: string; formula?: string; indent?: boolean; highlight?: boolean; separator?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      padding: `4px ${indent ? '10px 4px 20px' : '10px'}`,
      borderTop: separator ? '2px solid #e2e8f0' : undefined,
      backgroundColor: highlight ? '#f0f9ff' : indent ? '#faf5ff' : undefined,
      fontSize: '0.72rem',
      lineHeight: 1.6,
    }}>
      <span style={{ fontWeight: 600, color, minWidth: indent ? undefined : '110px', flexShrink: 0 }}>
        {label}
      </span>
      {formula && (
        <span style={{ color: '#94a3b8', fontFamily: mono, fontSize: '0.68rem', flexShrink: 1, minWidth: 0 }}>
          {formula}
        </span>
      )}
      <span style={{ marginLeft: 'auto', fontWeight: 700, fontFamily: mono, color: highlight ? '#047FA4' : color, fontSize: highlight ? '0.82rem' : '0.72rem', flexShrink: 0 }}>
        {value}
      </span>
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
}: SpreadsheetProps) {
  const hasRerank = rerankScore !== undefined
  const hasBoosts = (configBoost != null && configBoost !== 1.0) || (roleBoost != null && roleBoost !== 1.0)
  const stepNum = { current: 1 }
  const step = () => `${stepNum.current++}.`

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    }}>
      <div style={{
        padding: '6px 10px',
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Score-regnestykke
      </div>

      {/* Step: Retrieval */}
      {bm25 !== undefined && config && (
        <>
          <Row
            label={`${step()} BM25`}
            color="#0284c7"
            formula={`${bm25.toFixed(4)} \u00D7 ${config.bm25_weight.toFixed(2)}`}
            value={(bm25 * config.bm25_weight).toFixed(4)}
          />
          {semantic !== undefined && (
            <Row
              label={`${step()} Semantisk`}
              color="#059669"
              formula={`${semantic.toFixed(4)} \u00D7 ${config.semantic_weight.toFixed(2)}`}
              value={(semantic * config.semantic_weight).toFixed(4)}
            />
          )}
        </>
      )}

      {/* Step: RRF */}
      {rrf !== undefined && (
        <Row
          label={`${step()} RRF`}
          color="#047FA4"
          formula={`${config?.bm25_weight ?? 0.3}/(${config?.rrf_k ?? 60}+bm25_rank) + ${config?.semantic_weight ?? 0.7}/(${config?.rrf_k ?? 60}+sem_rank)`}
          value={rrf.toFixed(6)}
          separator
        />
      )}

      {/* Step: Rerank */}
      {hasRerank && (
        <>
          <Row
            label={`${step()} Rerank${typeof rerankRankChange === 'number' ? ` (${rerankRankChange > 0 ? '\u2191' : rerankRankChange < 0 ? '\u2193' : ''}${Math.abs(rerankRankChange)})` : ''}`}
            color="#7c3aed"
            formula="XGBoost LambdaMART"
            value={rerankScore!.toFixed(4)}
            separator
          />
          {rerankContributions && Object.keys(rerankContributions).length > 0 &&
            Object.entries(rerankContributions)
              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
              .map(([feature, val]) => (
                <Row
                  key={feature}
                  label={feature}
                  color={val >= 0 ? '#7c3aed' : '#dc2626'}
                  value={`${val >= 0 ? '+' : ''}${val.toFixed(3)}`}
                  indent
                />
              ))
          }
        </>
      )}

      {/* Step: Post-processing */}
      {hasBoosts && (() => {
        const factors: string[] = []
        if (configBoost != null && configBoost !== 1.0) factors.push(`${configBoost} (type)`)
        if (roleBoost != null && roleBoost !== 1.0) factors.push(`${roleBoost} (rolle)`)
        return (
          <Row
            label={`${step()} Boost`}
            color="#d97706"
            formula={`multiplikator: ${factors.join(', ')}`}
            value=""
            separator
          />
        )
      })()}

      {/* Final */}
      <Row
        label="Endelig"
        color="#047FA4"
        value={finalScore.toFixed(4)}
        highlight
        separator
      />
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
