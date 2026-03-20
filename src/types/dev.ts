import type { SearchResponse } from './search'

export interface WeightConfig {
  bm25_weight: number
  semantic_weight: number
  rrf_k: number
  temaside_boost: number
  retningslinje_boost: number
  role: string | null
  role_boost: number
  role_penalty: number
  rerank?: boolean
  explain?: boolean
}

export type PipelineStageId = 'hybrid' | 'rrf' | 'ltr' | 'boosts'

export interface SlotState {
  config: WeightConfig
  usedConfig: WeightConfig | null
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
  roleBoosted: number
  rolePenalized: number
  roleNeutral: number
}
