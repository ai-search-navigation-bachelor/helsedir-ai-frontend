import { ds } from '../../styles/dsTokens'

export type ScoreColorKey = 'bm25' | 'semantic' | 'rrf'

const SCORE_COLOR_MAP: Record<ScoreColorKey, string> = {
  bm25: ds.color('bla-2', 'base-default'),
  semantic: ds.color('gronn-2', 'base-default'),
  rrf: ds.color('logobla-1', 'text-default'),
}

export function resolveScoreColor(color: ScoreColorKey): string {
  return SCORE_COLOR_MAP[color]
}
