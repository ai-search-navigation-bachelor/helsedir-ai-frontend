import type { SearchResponse, SearchResult } from '../../types'
import type { ResultStats } from '../../types/dev'

export function computeStats(response: SearchResponse): ResultStats {
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

export function computeRankMap(results: SearchResult[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const [i, r] of results.entries()) {
    map.set(r.id, i + 1)
  }
  return map
}

export function getRankDiff(
  id: string,
  rankMapA: Map<string, number>,
  rankMapB: Map<string, number>,
): number | null {
  const rankA = rankMapA.get(id)
  const rankB = rankMapB.get(id)
  if (rankA === undefined || rankB === undefined) return null
  return rankA - rankB
}

export function parseExplanation(explanation?: string): {
  bm25?: number
  semantic?: number
} {
  if (!explanation) return {}
  const bm25Match = explanation.match(/BM25=(\d+\.?\d*)/)
  const semanticMatch = explanation.match(/Semantic=(\d+\.?\d*)/)
  return {
    bm25: bm25Match ? parseFloat(bm25Match[1]) : undefined,
    semantic: semanticMatch ? parseFloat(semanticMatch[1]) : undefined,
  }
}

export function formatInfoTypeLabel(infoType: string): string {
  const normalized = infoType.toLowerCase()
  const map: Record<string, string> = {
    'lov-eller-forskriftstekst-med-kommentar': 'Lov/forskrift m. kommentar',
    'regelverk-lov-eller-forskrift': 'Regelverk',
    'nasjonal-faglig-retningslinje': 'Retningslinje',
    'nasjonalt-forlop': 'Nasjonalt forløp',
  }
  if (map[normalized]) return map[normalized]
  return infoType
    .split('-')
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}
