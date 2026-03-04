import type { WeightConfig } from '../types/dev'

export const DEFAULT_CONFIG: WeightConfig = {
  bm25_weight: 0.3,
  semantic_weight: 0.7,
  rrf_k: 60,
  temaside_boost: 1.15,
  retningslinje_boost: 1.1,
}

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
}

export const PRESETS: Array<{ label: string; config: WeightConfig }> = [
  {
    label: 'Vår løsning',
    config: {
      bm25_weight: 0.3,
      semantic_weight: 0.7,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: 'Balansert',
    config: {
      bm25_weight: 0.5,
      semantic_weight: 0.5,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: 'Kun semantisk',
    config: {
      bm25_weight: 0.0,
      semantic_weight: 1.0,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: 'Kun BM25',
    config: {
      bm25_weight: 1.0,
      semantic_weight: 0.0,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
]
