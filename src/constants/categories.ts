/**
 * Category constants for search functionality
 */
import { TEMASIDE_CATEGORIES } from './temasider'

export const TEMASIDE_CATEGORY = 'temaside'
export const RETNINGSLINJE_CATEGORY = 'retningslinje'
export const ANBEFALINGER_CATEGORY = 'anbefaling'
export const REGELVERK_CATEGORY = 'regelverk-lov-eller-forskrift'
export const RAD_CATEGORY = 'veileder-lov-forskrift'

/**
 * The 5 categories we want to display in order
 */
export const CATEGORY_ORDER = [
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
  ANBEFALINGER_CATEGORY,
  REGELVERK_CATEGORY,
  RAD_CATEGORY,
]

/**
 * Available tema filters
 */
export const TEMA_OPTIONS: ReadonlyArray<{ value: string; label: string }> = TEMASIDE_CATEGORIES.map(
  (category) => ({
    value: category.slug,
    label: category.title,
  }),
)
