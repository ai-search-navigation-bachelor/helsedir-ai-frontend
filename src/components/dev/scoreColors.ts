export type ScoreColorKey = 'bm25' | 'semantic' | 'rrf' | 'rerank'

const SCORE_COLOR_MAP: Record<ScoreColorKey, string> = {
  bm25: '#0284c7',     // sky-600 (darker for light bg)
  semantic: '#059669',  // emerald-600
  rrf: '#047FA4',       // Helsedir logobla-2
  rerank: '#7c3aed',   // violet-600
}

export function resolveScoreColor(color: ScoreColorKey): string {
  return SCORE_COLOR_MAP[color]
}
