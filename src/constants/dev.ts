/** Default and preset weight configurations for the developer search-tuning page. */
import type { WeightConfig, PipelineStageId } from '../types/dev'

export const DEFAULT_CONFIG: WeightConfig = {
  bm25_weight: 0.3,
  semantic_weight: 0.7,
  rrf_k: 60,
  temaside_boost: 1.15,
  retningslinje_boost: 1.1,
  role: null,
  role_boost: 1.15,
  role_penalty: 0.85,
  rerank: false,
  explain: true,
}

export interface PipelineStageDef {
  id: PipelineStageId
  label: string
  description: string
  accentHex: string
}

export const PIPELINE_STAGES: PipelineStageDef[] = [
  { id: 'hybrid', label: 'Hybrid Search', description: 'BM25 + Semantisk', accentHex: '#047FA4' },
  { id: 'rrf', label: 'RRF Fusion', description: 'Listesammenslåing', accentHex: '#0369a1' },
  { id: 'ltr', label: 'LTR Reranking', description: 'XGBoost reranking', accentHex: '#7c3aed' },
  { id: 'boosts', label: 'Post-processing', description: 'Boost & rolletilpasning', accentHex: '#d97706' },
]

/**
 * Fixed reference config simulating Helsedir-style keyword search:
 * pure BM25 (no semantic), no RRF fusion.
 */
export const HELSEDIR_STYLE_CONFIG: WeightConfig = {
  bm25_weight: 1.0,
  semantic_weight: 0.0,
  rrf_k: 0,
  temaside_boost: 1.0,
  retningslinje_boost: 1.0,
  role: null,
  role_boost: 1.15,
  role_penalty: 0.85,
  rerank: false,
  explain: true,
}

export const PRESETS: Array<{ label: string; config: WeightConfig }> = [
  {
    label: 'Vår løsning',
    config: { ...DEFAULT_CONFIG },
  },
  {
    label: 'Med\nreranking',
    config: { ...DEFAULT_CONFIG, rerank: true },
  },
  {
    label: 'Kun BM25',
    config: { ...DEFAULT_CONFIG, bm25_weight: 1.0, semantic_weight: 0.0 },
  },
  {
    label: 'Kun semantisk',
    config: { ...DEFAULT_CONFIG, bm25_weight: 0.0, semantic_weight: 1.0 },
  },
]
