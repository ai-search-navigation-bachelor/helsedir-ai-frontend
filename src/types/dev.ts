import type { SearchResponse } from './search'

export interface WeightConfig {
  bm25_weight: number
  semantic_weight: number
  rrf_k: number
  temaside_boost: number
  retningslinje_boost: number
}

export interface SlotState {
  config: WeightConfig
  response: SearchResponse | null
  loading: boolean
  error: string | null
}

export interface ResultStats {
  total: number
  avgScoreTop10: number
  minScore: number
  maxScore: number
  categoryCounts: Record<string, number>
}
