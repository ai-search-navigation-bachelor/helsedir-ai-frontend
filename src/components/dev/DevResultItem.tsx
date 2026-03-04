import { ds, colors } from '../../styles/dsTokens'
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
  scoringMode?: 'hybrid' | 'keyword'
  maxScore?: number
}

export function DevResultItem({
  rank,
  result,
  rankDiff,
  config,
  scoringMode = 'hybrid',
  maxScore,
}: DevResultItemProps) {
  const diffColor =
    rankDiff === null
      ? undefined
      : rankDiff > 0
        ? { bg: '#dcfce7', text: '#166534' }
        : rankDiff < 0
          ? { bg: '#fee2e2', text: '#991b1b' }
          : { bg: '#f1f5f9', text: '#475569' }

  const infoTypeLabel = formatInfoTypeLabel(result.info_type)
  const parsed = parseExplanation(result.explanation)
  const bm25 = result.bm25_score ?? parsed.bm25
  const semantic = result.semantic_score ?? parsed.semantic
  const hasComponents = bm25 !== undefined || semantic !== undefined
  const weightedBm25 = bm25 !== undefined && config ? bm25 * config.bm25_weight : bm25
  const weightedSemantic =
    semantic !== undefined && config ? semantic * config.semantic_weight : semantic

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '3px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '1px 8px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: ds.color('logobla-1', 'text-default'),
              backgroundColor: '#e8f4f8',
              maxWidth: '250px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={result.info_type}
          >
            {infoTypeLabel}
          </span>

          {rankDiff !== null && rankDiff !== 0 && diffColor && (
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
              {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
            </span>
          )}
        </div>

        <div style={{ fontWeight: 500, color: colors.text, lineHeight: 1.4 }}>
          {result.title}
        </div>

        {result.explanation && (
          <div
            style={{
              fontSize: '0.68rem',
              color: colors.textSubtle,
              fontFamily: 'monospace',
              marginTop: '3px',
            }}
          >
            {result.explanation}
          </div>
        )}

        {(hasComponents || scoringMode === 'keyword') && (
          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {config && (
              <div
                style={{
                  fontSize: '0.66rem',
                  color: colors.textSubtle,
                  fontFamily: 'monospace',
                  marginBottom: '2px',
                }}
              >
                BM25 {bm25?.toFixed(2) ?? '—'} × {config.bm25_weight.toFixed(2)} ={' '}
                {weightedBm25?.toFixed(2) ?? '—'} | Sem. {semantic?.toFixed(2) ?? '—'} ×{' '}
                {config.semantic_weight.toFixed(2)} = {weightedSemantic?.toFixed(2) ?? '—'}
              </div>
            )}
            {bm25 !== undefined && (
              <ScoreBar
                label={config ? 'BM25×w' : 'BM25'}
                value={weightedBm25 ?? bm25}
                color="bm25"
              />
            )}
            {semantic !== undefined && (
              <ScoreBar
                label={config ? 'Sem.×w' : 'Sem.'}
                value={weightedSemantic ?? semantic}
                color="semantic"
              />
            )}
            {maxScore != null && maxScore > 0 && (
              <ScoreBar
                label="RRF-norm"
                value={result.score / maxScore}
                color="rrf"
              />
            )}
          </div>
        )}
      </div>
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
        padding: '12px 16px',
        backgroundColor: colors.surfaceTinted,
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, marginBottom: '2px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.75rem', color: colors.textSubtle, margin: 0 }}>{subtitle}</p>
      {extraInfo && (
        <p style={{ fontSize: '0.75rem', color: colors.textSubtle, margin: 0 }}>{extraInfo}</p>
      )}
      <ScoreLegend mode={mode} />
    </div>
  )
}
